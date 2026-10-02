from app.db.database import SessionLocal
from app.models.review import Review
from app.models.user import User
from app.services.github_service import (
    get_pull_request,
    get_pull_request_file_contents,
    create_pull_request_review,
    prepare_inline_review_comments,
)
from app.services.pr_reviewer import (
    review_pull_request,
    build_github_review_summary,
)


def run_automatic_pr_review(
    owner: str,
    repo: str,
    pull_number: int,
):
    db = SessionLocal()

    try:
        print(f"Starting automatic review for " f"{owner}/{repo} PR #{pull_number}")

        pull_request = get_pull_request(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

        commit_sha = pull_request["head"]["sha"]

        print(f"Current PR commit: {commit_sha}")

        existing_review = (
            db.query(Review)
            .filter(
                Review.repo_owner == owner,
                Review.repo_name == repo,
                Review.pull_number == pull_number,
                Review.commit_sha == commit_sha,
                Review.status == "completed",
            )
            .first()
        )

        if existing_review:
            print(
                f"PR #{pull_number} at commit "
                f"{commit_sha} was already reviewed. "
                f"Skipping review."
            )
            return

        user = db.query(User).filter(User.github_login == owner).first()

        if user:
            print(f"Review belongs to user " f"{user.id} ({user.github_login})")
        else:
            print(f"No application user found for " f"GitHub owner: {owner}")

        files = get_pull_request_file_contents(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

        print(f"Files received: {len(files)}")

        review_result = review_pull_request(files)

        score = review_result["score"]
        issues = review_result["issues"]

        print(f"Review completed: " f"score={score}, issues={len(issues)}")

        review_summary = build_github_review_summary(review_result)

        inline_data = prepare_inline_review_comments(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            files=files,
            issues=issues,
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

        print(f"GitHub review created: " f"{github_review.get('id')}")

        database_review = Review(
            user_id=user.id if user else None,
            score=score,
            summary=(f"Automatic AI review for " f"{repo} PR #{pull_number}"),
            issues=issues,
            status="completed",
            repo_owner=owner,
            repo_name=repo,
            pull_number=pull_number,
            commit_sha=commit_sha,
        )

        db.add(database_review)
        db.commit()
        db.refresh(database_review)

        print(f"Review saved to database: " f"ID {database_review.id}")

        print(f"Review user_id: " f"{database_review.user_id}")

        print(f"Inline comments created: " f"{len(inline_data['comments'])}")

    except Exception as error:
        db.rollback()

        print(
            f"Automatic PR review failed for "
            f"{owner}/{repo} PR #{pull_number}: "
            f"{error}"
        )

    finally:
        db.close()
