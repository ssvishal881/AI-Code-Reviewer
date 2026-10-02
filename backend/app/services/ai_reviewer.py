import json

from ollama import chat

MODEL_NAME = "qwen2.5-coder:3b"


def review_code(code: str, file_name: str):
    system_prompt = """
You are a code reviewer.

Review the provided code and find real problems in these areas:
- Security
- Bugs
- Performance
- Code quality
- Best practices

Only report problems that are supported by the code.
Do not invent, guess, or assume problems.
Do not report minor style preferences.

Bug detection:
- Check conditions and logic.
- Check null or undefined values.
- Check incorrect object or array access.
- Check incorrect function arguments.
- Check incorrect API or library usage.
- Check async/await and promise handling.
- Check error handling.
- Check incorrect state or data updates.
- Check runtime errors.
- Check authentication and authorization logic.
- Check edge cases that can cause incorrect behavior.

Only report a bug when the code provides enough evidence that the problem can actually happen.

For every real issue provide:
- category
- severity
- title
- line
- description
- suggestion

The description must:
- Explain what is wrong.
- Explain what can happen because of the problem.
- Be based on the actual code.

The suggestion must:
- Give a practical fix.
- Explain what should be changed.
- Be 1-3 sentences.
- Be specific instead of generic.
- Include a small code example only when it makes the fix clearer.
- Do not write a long tutorial.

Severity:
- critical: serious security issue or major application failure
- high: important bug, security, or performance problem
- medium: meaningful problem that should be fixed
- low: minor quality or maintainability problem

Categories:
- security
- bug
- performance
- quality
- best-practice

Return only valid JSON.

Use this structure:
{
  "score": 0,
  "summary": "short review summary",
  "issues": [
    {
      "category": "bug",
      "severity": "high",
      "title": "Short issue title",
      "file": "filename",
      "line": 1,
      "description": "Explain what is wrong and what can happen.",
      "suggestion": "Explain the practical fix in 1-3 sentences."
    }
  ]
}

Score:
- 100 means no significant issues
- Lower the score when real issues exist
- Do not give 100 when a real issue exists
"""

    user_prompt = f"""
Review this code carefully.

File: {file_name}

Code:
{code}
"""

    try:
        response = chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            format="json",
        )

        raw_content = response["message"]["content"]

    except Exception as error:
        print(f"AI review failed: {error}")

        return {
            "score": 50,
            "summary": "AI review could not be completed.",
            "issues": [],
        }

    try:
        result = json.loads(raw_content)

    except json.JSONDecodeError:
        print("Invalid AI JSON response:")
        print(raw_content)

        return {
            "score": 50,
            "summary": "AI returned an invalid review response.",
            "issues": [],
        }

    raw_issues = result.get("issues", [])

    if not isinstance(raw_issues, list):
        raw_issues = []

    normalized_issues = []

    allowed_categories = {
        "bug",
        "security",
        "performance",
        "quality",
        "best-practice",
    }

    allowed_severities = {
        "low",
        "medium",
        "high",
        "critical",
    }

    for issue in raw_issues:
        if not isinstance(issue, dict):
            continue

        category = (
            str(
                issue.get(
                    "category",
                    "quality",
                )
            )
            .lower()
            .strip()
        )

        severity = (
            str(
                issue.get(
                    "severity",
                    "medium",
                )
            )
            .lower()
            .strip()
        )

        if category not in allowed_categories:
            category = "quality"

        if severity not in allowed_severities:
            severity = "medium"

        try:
            line = int(
                issue.get(
                    "line",
                    1,
                )
            )
        except (TypeError, ValueError):
            line = 1

        if line < 1:
            line = 1

        title = str(
            issue.get(
                "title",
                "Code issue",
            )
        ).strip()

        description = str(
            issue.get(
                "description",
                "Potential issue detected.",
            )
        ).strip()

        suggestion = str(
            issue.get(
                "suggestion",
                "Review and fix this issue.",
            )
        ).strip()

        normalized_issues.append(
            {
                "category": category,
                "severity": severity,
                "title": title,
                "file": file_name,
                "line": line,
                "description": description,
                "suggestion": suggestion,
                "source": "AI Review",
            }
        )

    unique_issues = []
    seen = set()

    for issue in normalized_issues:
        normalized_title = (
            issue["title"].lower().replace("-", " ").replace("_", " ").strip()
        )

        issue_key = (
            issue["category"],
            normalized_title,
            issue["file"],
            issue["line"],
        )

        if issue_key in seen:
            continue

        seen.add(issue_key)
        unique_issues.append(issue)

    severity_penalty = {
        "low": 5,
        "medium": 10,
        "high": 20,
        "critical": 30,
    }

    calculated_score = 100

    for issue in unique_issues:
        calculated_score -= severity_penalty.get(
            issue["severity"],
            10,
        )

    calculated_score = max(
        0,
        min(
            100,
            calculated_score,
        ),
    )

    summary = result.get(
        "summary",
        "Code review completed.",
    )

    if not isinstance(summary, str):
        summary = "Code review completed."

    summary = summary.strip()

    if unique_issues:
        summary = f"{len(unique_issues)} issue(s) detected. " f"{summary}"
    else:
        summary = "No significant issues detected. " f"{summary}"

    return {
        "score": calculated_score,
        "summary": summary,
        "issues": unique_issues,
    }


def review_pull_request_changes(changes: list):
    results = []

    for change in changes:
        patch = change.get(
            "patch",
            "",
        )

        if not patch:
            continue

        file_name = change.get(
            "file",
            "unknown",
        )

        review = review_code(
            patch,
            file_name,
        )

        results.append(
            {
                "file": file_name,
                "status": change.get("status"),
                "additions": change.get(
                    "additions",
                    0,
                ),
                "deletions": change.get(
                    "deletions",
                    0,
                ),
                "review": review,
            }
        )

    return results
