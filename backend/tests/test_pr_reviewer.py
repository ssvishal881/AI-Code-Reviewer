from fastapi.testclient import TestClient

from app.main import app
from app.services.pr_reviewer import build_pr_review_comment, review_pull_request

client = TestClient(app)


def test_github_webhook_rejects_invalid_json():
    response = client.post(
        "/webhooks/github",
        data="not-json",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json()["status"] == "error"


def test_review_pull_request_collects_issues_and_score(monkeypatch):
    monkeypatch.setattr(
        "app.services.pr_reviewer.get_analyzers",
        lambda file_name: ["ai", "eslint", "semgrep"],
    )
    monkeypatch.setattr(
        "app.services.pr_reviewer.review_code",
        lambda code, file_name: {
            "score": 80,
            "summary": "AI summary",
            "issues": [
                {
                    "severity": "high",
                    "title": "ai issue",
                    "file": file_name,
                    "line": 3,
                    "description": "Potential problem in the code.",
                    "suggestion": "Fix the logic.",
                    "source": "AI Review",
                }
            ],
        },
    )
    monkeypatch.setattr(
        "app.services.pr_reviewer.run_eslint",
        lambda code, file_name: [
            {
                "severity": "medium",
                "title": "eslint issue",
                "file": file_name,
                "line": 5,
                "description": "Lint warning.",
                "suggestion": "Fix lint warning.",
                "source": "ESLint",
            }
        ],
    )
    monkeypatch.setattr(
        "app.services.pr_reviewer.run_semgrep",
        lambda code, file_name: [
            {
                "severity": "low",
                "title": "semgrep issue",
                "file": file_name,
                "line": 7,
                "description": "Possible security issue.",
                "suggestion": "Review the check.",
                "source": "Semgrep",
            }
        ],
    )

    files = [
        {
            "file": "example.py",
            "content": "print('hello')",
            "status": "modified",
            "additions": 1,
            "deletions": 0,
        }
    ]

    review = review_pull_request(files)

    assert review["score"] == 65
    assert len(review["issues"]) == 3
    assert review["files"][0]["summary"] == "AI summary"

    comment = build_pr_review_comment(review)
    assert "## 🤖 AI Code Review" in comment
    assert "**Overall Score:** 65/100" in comment
