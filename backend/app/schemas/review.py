from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewCreate(BaseModel):
    score: int
    summary: str
    status: str


class ReviewResponse(BaseModel):
    id: int
    user_id: int | None = None
    score: int
    summary: str
    issues: list
    status: str
    repo_owner: str | None = None
    repo_name: str | None = None
    pull_number: int | None = None
    commit_sha: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
