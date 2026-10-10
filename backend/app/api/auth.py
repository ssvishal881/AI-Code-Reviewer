import os
import base64, hashlib, hmac, json, time
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.security import get_current_user

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

OAUTH_STATE_SECRET = os.getenv("OAUTH_STATE_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
STATE_MAX_AGE_SECONDS = 600

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"

router = APIRouter(
    prefix="/auth/github",
    tags=["GitHub Authentication"],
)


def create_oauth_state(user_id: int) -> str:
    if not OAUTH_STATE_SECRET:
        raise ValueError("OAUTH_STATE_SECRET is not configured")
    payload = json.dumps(
        {"uid": user_id, "exp": int(time.time()) + STATE_MAX_AGE_SECONDS}
    ).encode()
    body = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    sig = hmac.new(
        OAUTH_STATE_SECRET.encode(), body.encode(), hashlib.sha256
    ).hexdigest()
    return f"{body}.{sig}"


def verify_oauth_state(state: str) -> int | None:
    if not OAUTH_STATE_SECRET:
        raise ValueError("OAUTH_STATE_SECRET is not configured")
    try:
        body, sig = state.rsplit(".", 1)
        expected = hmac.new(
            OAUTH_STATE_SECRET.encode(), body.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if data["exp"] < time.time():
            return None
        return int(data["uid"])
    except Exception:
        return None


def get_user_github_token(db: Session, user_id: int) -> str:
    """
    Returns the logged-in user's own GitHub token.
    Raises instead of returning None, so a user who has not connected
    GitHub can never fall back to the global GITHUB_TOKEN.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Application user not found",
        )

    if not user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub account is not connected for this user",
        )

    return user.github_access_token


@router.get("/connect-url")
def github_connect_url(current_user: User = Depends(get_current_user)):
    if not GITHUB_CLIENT_ID or not GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured",
        )

    if not OAUTH_STATE_SECRET:
        raise HTTPException(
            status_code=500,
            detail="OAUTH_STATE_SECRET is not configured",
        )

    query = urlencode(
        {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": "repo",
            "state": create_oauth_state(current_user.id),
        }
    )
    return {"url": f"{GITHUB_AUTHORIZE_URL}?{query}"}


@router.get("/callback")
async def github_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?github=error")

    if not code:
        raise HTTPException(
            status_code=400,
            detail="GitHub authorization code is missing",
        )

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

    user_id = verify_oauth_state(state)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired GitHub state")

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
    github_username = github_user.get("login")

    if not github_id or not github_username:
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
        db.query(User).filter(User.github_login == github_username).first()
    )

    if existing_github_login and existing_github_login.id != user.id:
        raise HTTPException(
            status_code=400,
            detail="This GitHub account is already connected to another user.",
        )

    user.github_id = github_id
    user.github_login = github_username
    user.github_access_token = access_token

    db.commit()
    db.refresh(user)

    return RedirectResponse(url=f"{FRONTEND_URL}/settings?github=connected")


@router.get("/repositories")
def github_repositories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    access_token = get_user_github_token(db, current_user.id)

    try:
        repositories = get_github_repositories(access_token=access_token)
        return {"repositories": repositories}

    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code
        print(f"GitHub repositories API returned status {status_code}")

        if status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub token is invalid. Reconnect your GitHub account.",
            )

        raise HTTPException(
            status_code=502,
            detail="GitHub repository request failed.",
        )

    except Exception as error:
        print(f"GitHub repositories error: {type(error).__name__}")
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch GitHub repositories.",
        )


@router.get("/repositories/{owner}/{repo}/pulls")
def github_pull_requests(
    owner: str,
    repo: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    access_token = get_user_github_token(db, current_user.id)

    try:
        pull_requests = get_github_pull_requests(
            owner,
            repo,
            access_token=access_token,
        )
        return {"pull_requests": pull_requests}

    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code
        print(f"GitHub pulls API returned status {status_code} for {owner}/{repo}")

        if status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub token is invalid. Reconnect your GitHub account.",
            )

        raise HTTPException(
            status_code=502,
            detail="GitHub pull request request failed.",
        )

    except Exception as error:
        print(f"GitHub pulls error: {type(error).__name__}")
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch GitHub pull requests.",
        )


@router.delete("/disconnect")
async def github_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    old_token = current_user.github_access_token

    current_user.github_id = None
    current_user.github_login = None
    current_user.github_access_token = None
    db.commit()

    # Best effort: also revoke the token on GitHub. Failure is ignored.
    if old_token and GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET:
        try:
            async with httpx.AsyncClient() as client:
                await client.request(
                    "DELETE",
                    f"{GITHUB_API_URL}/applications/{GITHUB_CLIENT_ID}/token",
                    auth=(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET),
                    headers={"Accept": "application/vnd.github+json"},
                    json={"access_token": old_token},
                    timeout=10,
                )
        except Exception as error:
            print(f"GitHub token revoke failed: {type(error).__name__}")

    return {"message": "GitHub disconnected"}
