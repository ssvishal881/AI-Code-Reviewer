def calculate_score(issues: list) -> int:
    """
    Calculate a final score from all detected issues.

    Start at 100 and deduct points based on severity.
    """

    deductions = {
        "critical": 30,
        "high": 20,
        "medium": 10,
        "low": 5,
    }

    score = 100

    for issue in issues:
        severity = issue.get("severity", "low").lower()
        score -= deductions.get(severity, 0)

    return max(0, score)


def remove_duplicates(issues: list) -> list:
    """
    Remove duplicate findings from different analyzers.
    """

    unique_issues = []
    seen = set()

    for issue in issues:
        key = (
            issue.get("file"),
            issue.get("line"),
            issue.get("title"),
        )

        if key in seen:
            continue

        seen.add(key)
        unique_issues.append(issue)

    return unique_issues
