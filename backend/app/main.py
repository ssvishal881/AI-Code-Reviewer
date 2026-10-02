from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.database import engine, get_db
from app.db.base import Base
from app.models.review import Review
from app.api.reviews import router as reviews_router
from app.api.ai_review import router as ai_review_router
from app.api.static_analysis import router as static_analysis_router
from app.api.semgrep_analysis import router as semgrep_router
from app.models.user import User
from app.api.user_auth import router as user_auth_router
from app.services.github_service import (
    create_pull_request_review,
    get_github_user,
    get_pull_request_files,
    get_pull_request_changes,
    get_file_content,
    get_pull_request,
    get_pull_request_file_contents,
    create_pull_request_review,
)
from app.services.ai_reviewer import review_pull_request_changes
from app.services.pr_reviewer import review_pull_request, build_pr_review_comment
from app.api.github_webhook import router as github_webhook_router
from app.api.auth import router as auth_router
from app.services.pr_reviewer import (
    review_pull_request,
    build_github_review_summary,
)
from app.services.github_service import prepare_inline_review_comments

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
    allow_origins=["https://ai-code-reviewer-smoky-six.vercel.app"],
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
def github_test():
    user = get_github_user()

    return {
        "github": "connected",
        "login": user.get("login"),
    }


@app.get("/github/pr/{owner}/{repo}/{pull_number}/files")
def github_pr_files(
    owner: str,
    repo: str,
    pull_number: int,
):
    files = get_pull_request_files(
        owner,
        repo,
        pull_number,
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
):
    changes = get_pull_request_changes(
        owner,
        repo,
        pull_number,
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
):
    changes = get_pull_request_changes(
        owner,
        repo,
        pull_number,
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
):
    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
    )

    ref = pull_request["head"]["sha"]

    content = get_file_content(
        owner=owner,
        repo=repo,
        file_path=file_path,
        ref=ref,
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
    user_id: int,
    db: Session = Depends(get_db),
):
    files = get_pull_request_file_contents(
        owner,
        repo,
        pull_number,
    )

    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
    )

    commit_sha = pull_request["head"]["sha"]
    review = review_pull_request(files)
    review_summary = build_github_review_summary(review)

    inline_data = prepare_inline_review_comments(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        files=files,
        issues=review["issues"],
    )

    github_review = create_pull_request_review(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        body=review_summary,
        commit_id=inline_data["commit_id"],
        comments=inline_data["comments"],
        event="COMMENT",
    )

    database_review = Review(
        user_id=user_id,
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

    print(f"GitHub review created: " f"{github_review.get('id')}")

    print(f"Inline comments created: " f"{len(inline_data['comments'])}")

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
