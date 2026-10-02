from typing import Any
import hashlib
import hmac
import os

from dotenv import load_dotenv

from fastapi import APIRouter, BackgroundTasks, Request
from fastapi.responses import JSONResponse

from app.services.automatic_pr_review import run_automatic_pr_review

load_dotenv()

WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

if not WEBHOOK_SECRET:
    raise ValueError("GITHUB_WEBHOOK_SECRET is not set")


router = APIRouter(
    prefix="/webhooks",
    tags=["GitHub Webhooks"],
)


def verify_github_signature(
    body: bytes,
    signature: str | None,
) -> bool:
    """
    Verify that the webhook request was sent by GitHub
    using the configured webhook secret.
    """

    if not signature:
        return False

    expected_signature = (
        "sha256="
        + hmac.new(
            WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
    )

    return hmac.compare_digest(
        expected_signature,
        signature,
    )


@router.post("/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Receive and process GitHub webhook events.
    """

    # Get GitHub event type
    event = request.headers.get("X-GitHub-Event")

    # Read raw request body first.
    # This is required for webhook signature verification.
    body = await request.body()

    # Prevent JSONDecodeError when the body is empty.
    if not body:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "reason": "Request body is empty",
            },
        )

    # Get GitHub webhook signature.
    signature = request.headers.get("X-Hub-Signature-256")

    # Verify GitHub webhook signature.
    if not verify_github_signature(body, signature):
        print("ERROR: Invalid GitHub webhook signature")

        return JSONResponse(
            status_code=401,
            content={
                "status": "error",
                "reason": "Invalid webhook signature",
            },
        )

    # Parse JSON payload.
    try:
        payload: dict[str, Any] = await request.json()

    except ValueError:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "reason": "Request body is not valid JSON",
            },
        )

    # GitHub Ping Event
    if event == "ping":
        print("GitHub webhook ping received")

        return {
            "status": "received",
            "event": "ping",
        }

    # Ignore Non Pull Request Events

    if event != "pull_request":
        print(f"Ignored GitHub event: {event}")

        return {
            "status": "ignored",
            "event": event,
        }

    # Extract Pull Request Information

    action = payload.get("action")
    repository = payload.get("repository")
    pull_request = payload.get("pull_request")

    if not repository or not pull_request:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "reason": ("Missing repository or pull request information"),
            },
        )

    owner = repository.get("owner", {}).get("login")
    repo = repository.get("name")
    pull_number = pull_request.get("number")

    if not owner or not repo or not pull_number:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "reason": ("Missing owner, repository, " "or pull request number"),
            },
        )

    print(
        f"GitHub PR webhook received: "
        f"{owner}/{repo} PR #{pull_number}, "
        f"action={action}"
    )

    # Automatic PR Review Actions

    # Run automatic review when:
    # PR is opened
    # PR is reopened
    # New commits are pushed to the PR
    review_actions = {
        "opened",
        "reopened",
        "synchronize",
    }

    if action in review_actions:
        background_tasks.add_task(
            run_automatic_pr_review,
            owner,
            repo,
            pull_number,
        )

        print(f"Automatic PR review scheduled: " f"{owner}/{repo} PR #{pull_number}")

    else:
        print(f"PR action '{action}' received. " f"No automatic review required.")

    # Response
    return {
        "status": "received",
        "event": "pull_request",
        "action": action,
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
    }
