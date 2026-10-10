from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import engine, get_db
from app.db.base import Base
from app.models.review import Review
from app.api.reviews import router as reviews_router
from app.api.ai_review import router as ai_review_router
from app.api.static_analysis import router as static_analysis_router
from app.api.semgrep_analysis import router as semgrep_router
from app.models.user import User
import time
from app.api.user_auth import router as user_auth_router
from app.services.github_service import (
    create_pull_request_review,
    get_github_user,
    get_pull_request_files,
    get_pull_request_changes,
    get_file_content,
    get_pull_request,
    get_pull_request_file_contents,
)
from app.services.ai_reviewer import review_pull_request_changes
from app.services.pr_reviewer import review_pull_request
from app.api.github_webhook import router as github_webhook_router
from app.api.auth import router as auth_router
from app.services.pr_reviewer import build_github_review_summary
from app.services.github_service import prepare_inline_review_comments
from app.core.security import get_current_user

app = FastAPI(title="AI Code Reviewer")
app.include_router(reviews_router)
app.include_router(ai_review_router)
app.include_router(static_analysis_router)
app.include_router(semgrep_router)
app.include_router(github_webhook_router)
app.include_router(auth_router)
app.include_router(user_auth_router)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-code-reviewer-smoky-six.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI code reviewer is running."}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

        return {"database": "connected", "result": result.scalar()}


@app.get("/github/test")
def github_test(
    current_user: User = Depends(get_current_user),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    user = get_github_user(
        access_token=current_user.github_access_token,
    )

    return {
        "github": "connected",
        "login": user.get("login"),
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/files")
def github_pr_files(
    owner: str,
    repo: str,
    pull_number: int,
    current_user: User = Depends(get_current_user),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    files = get_pull_request_files(
        owner,
        repo,
        pull_number,
        access_token=current_user.github_access_token,
    )

    return {
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
        "file_count": len(files),
        "files": files,
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/changes")
def github_pr_changes(
    owner: str,
    repo: str,
    pull_number: int,
    current_user: User = Depends(get_current_user),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    changes = get_pull_request_changes(
        owner,
        repo,
        pull_number,
        access_token=current_user.github_access_token,
    )

    return {
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
        "file_count": len(changes),
        "changes": changes,
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/review")
def github_pr_review(
    owner: str,
    repo: str,
    pull_number: int,
    current_user: User = Depends(get_current_user),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    changes = get_pull_request_changes(
        owner,
        repo,
        pull_number,
        access_token=current_user.github_access_token,
    )

    reviews = review_pull_request_changes(changes)

    return {
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
        "reviews": reviews,
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/file/{file_path:path}")
def github_pr_file_content(
    owner: str,
    repo: str,
    pull_number: int,
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    access_token = current_user.github_access_token

    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
        access_token=access_token,
    )

    ref = pull_request["head"]["sha"]

    content = get_file_content(
        owner=owner,
        repo=repo,
        file_path=file_path,
        ref=ref,
        access_token=access_token,
    )

    return {
        "file": file_path,
        "commit": ref,
        "content": content,
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/full-review")
def github_full_pr_review(
    owner: str,
    repo: str,
    pull_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected",
        )

    access_token = current_user.github_access_token

    start_time = time.perf_counter()
    last_time = start_time

    def lap(stage: str):
        nonlocal last_time
        now = time.perf_counter()
        print(
            f"[PR REVIEW] {stage}: {now - last_time:.2f}s "
            f"(total {now - start_time:.2f}s)",
            flush=True,
        )
        last_time = now

    files = get_pull_request_file_contents(
        owner,
        repo,
        pull_number,
        access_token=access_token,
    )
    lap("Fetch PR files and contents")

    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
        access_token=access_token,
    )
    lap("Fetch PR details")

    commit_sha = pull_request["head"]["sha"]
    review = review_pull_request(files)
    review_summary = build_github_review_summary(review)
    lap("AI + ESLint + Semgrep review")

    inline_data = prepare_inline_review_comments(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        files=files,
        issues=review["issues"],
        access_token=access_token,
    )

    github_review = create_pull_request_review(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        body=review_summary,
        commit_id=inline_data["commit_id"],
        comments=inline_data["comments"],
        event="COMMENT",
        access_token=access_token,
    )

    database_review = Review(
        user_id=current_user.id,
        score=review["score"],
        summary=f"AI review for {repo} PR #{pull_number}",
        issues=review["issues"],
        status="completed",
        repo_owner=owner,
        repo_name=repo,
        pull_number=pull_number,
        commit_sha=commit_sha,
    )

    db.add(database_review)
    db.commit()
    db.refresh(database_review)

    return {
        "review_id": database_review.id,
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
        "review": review,
        "github_review_id": github_review.get("id"),
        "github_review_state": github_review.get("state"),
        "inline_comments_created": len(inline_data["comments"]),
    }
