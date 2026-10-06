import re
from difflib import SequenceMatcher


def calculate_score(issues: list) -> int:
    deductions = {
        "critical": 30,
        "high": 20,
        "medium": 10,
        "low": 5,
    }

    if not issues:
        return 100

    score = 100

    for issue in issues:
        severity = str(issue.get("severity", "low")).lower()
        score -= deductions.get(severity, 0)

    return max(0, min(100, score))


def normalize_text(value: str) -> str:
    value = str(value or "").lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def remove_duplicates(issues: list) -> list:
    if not issues:
        return []

    unique_issues = []

    severity_rank = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4,
    }

    for issue in issues:
        if not isinstance(issue, dict):
            continue

        file_name = normalize_text(issue.get("file", ""))
        title = normalize_text(issue.get("title", ""))
        description = normalize_text(issue.get("description", ""))
        category = normalize_text(issue.get("category", ""))
        line = issue.get("line")

        duplicate_index = None

        for index, existing in enumerate(unique_issues):
            existing_file = normalize_text(existing.get("file", ""))
            existing_title = normalize_text(existing.get("title", ""))
            existing_description = normalize_text(existing.get("description", ""))
            existing_category = normalize_text(existing.get("category", ""))
            existing_line = existing.get("line")

            same_file = file_name == existing_file
            same_line = line == existing_line
            same_title = title == existing_title

            similar_description = (
                bool(description)
                and bool(existing_description)
                and SequenceMatcher(
                    None,
                    description,
                    existing_description,
                ).ratio()
                >= 0.85
            )

            same_finding = same_file and (
                (same_line and same_title)
                or (same_line and category == existing_category and similar_description)
            )

            if same_finding:
                duplicate_index = index
                break

        if duplicate_index is None:
            unique_issues.append(issue)
            continue

        existing = unique_issues[duplicate_index]

        existing_severity = str(existing.get("severity", "low")).lower()

        current_severity = str(issue.get("severity", "low")).lower()

        if severity_rank.get(current_severity, 0) > severity_rank.get(
            existing_severity, 0
        ):
            existing["severity"] = current_severity

        sources = set()

        for item in (existing, issue):
            source = str(item.get("source", "")).strip()

            if source:
                sources.update(
                    part.strip() for part in source.split(",") if part.strip()
                )

        if sources:
            existing["source"] = ", ".join(sorted(sources))

    return unique_issues
