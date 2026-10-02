import os
import httpx

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.github_service import (
    get_github_repositories,
    get_github_pull_requests,
)

load_dotenv()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"

router = APIRouter(
    prefix="/auth/github",
    tags=["GitHub Authentication"],
)


@router.get("/login")
def github_login(
    user_id: int = Query(...),
):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID is not configured",
        )

    if not GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_REDIRECT_URI is not configured",
        )

    authorization_url = (
        f"{GITHUB_AUTHORIZE_URL}"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&scope=repo"
        f"&state={user_id}"
    )

    return RedirectResponse(
        url="http://localhost:5173/settings",
    )


@router.get("/callback")
async def github_callback(
    code: str,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID is not configured",
        )

    if not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_SECRET is not configured",
        )

    if not GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_REDIRECT_URI is not configured",
        )

    if not state:
        raise HTTPException(
            status_code=400,
            detail="GitHub user information is missing",
        )

    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub user information",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Application user not found",
        )

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_ACCESS_TOKEN_URL,
            headers={
                "Accept": "application/json",
            },
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            timeout=10,
        )

        token_response.raise_for_status()
        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "GitHub authentication failed",
                    "response": token_data,
                },
            )

        user_response = await client.get(
            f"{GITHUB_API_URL}/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=10,
        )

        user_response.raise_for_status()
        github_user = user_response.json()

    github_id = github_user.get("id")
    github_login = github_user.get("login")

    if not github_id or not github_login:
        raise HTTPException(
            status_code=400,
            detail="GitHub user information is incomplete",
        )

    existing_github_user = db.query(User).filter(User.github_id == github_id).first()

    if existing_github_user and existing_github_user.id != user.id:
        raise HTTPException(
            status_code=400,
            detail="This GitHub account is already connected to another user.",
        )

    existing_github_login = (
        db.query(User).filter(User.github_login == github_login).first()
    )

    if existing_github_login and existing_github_login.id != user.id:
        raise HTTPException(
            status_code=400,
            detail="This GitHub account is already connected to another user.",
        )

    user.github_id = github_id
    user.github_login = github_login

    db.commit()
    db.refresh(user)

    return {
        "message": "GitHub authentication successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "github_id": user.github_id,
            "github_login": user.github_login,
        },
        "github_user": {
            "id": github_user.get("id"),
            "login": github_user.get("login"),
            "name": github_user.get("name"),
            "avatar_url": github_user.get("avatar_url"),
        },
        "access_token_received": True,
    }


@router.get("/repositories")
def github_repositories():
    try:
        repositories = get_github_repositories()

        return {
            "repositories": repositories,
        }

    except Exception as error:
        print(f"Failed to fetch GitHub repositories: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch GitHub repositories",
        )


@router.get("/repositories/{owner}/{repo}/pulls")
def github_pull_requests(
    owner: str,
    repo: str,
):
    try:
        pull_requests = get_github_pull_requests(
            owner,
            repo,
        )

        return {
            "pull_requests": pull_requests,
        }

    except Exception as error:
        print(f"Failed to fetch GitHub pull requests for " f"{owner}/{repo}: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch GitHub pull requests",
        )
