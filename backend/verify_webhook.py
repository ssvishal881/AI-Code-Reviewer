from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

invalid = client.post(
    "/webhooks/github",
    data="not-json",
    headers={"content-type": "application/json"},
)
print("invalid_status=", invalid.status_code)
print("invalid_body=", invalid.json())

valid = client.post(
    "/webhooks/github",
    json={
        "action": "opened",
        "pull_request": {"number": 7},
        "repository": {"name": "demo", "owner": {"login": "octocat"}},
    },
)
print("valid_status=", valid.status_code)
print("valid_body=", valid.json())
