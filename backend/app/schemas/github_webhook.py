from typing import Any

from pydantic import BaseModel


class GitHubWebhookPayload(BaseModel):
    action: str
    repository: dict[str, Any]
    pull_request: dict[str, Any]

    model_config = {"extra": "allow"}
