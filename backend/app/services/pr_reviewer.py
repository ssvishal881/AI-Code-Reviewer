import time
from app.services.ai_reviewer import review_code
from app.services.review_processor import (
    calculate_score,
    remove_duplicates,
)
from app.services.static_analyzer import run_eslint
from app.services.semgrep_analyzer import run_semgrep
from app.services.analyzer_router import get_analyzers


def build_review_input(file: dict) -> str:
    patch = file.get("patch", "")
    content = file.get("content", "")

    return f"""
You are reviewing a GitHub Pull Request.

FILE:
{file.get("file", "Unknown file")}

CHANGED CODE / DIFF:
{patch}

FULL FILE:
{content}

Review primarily the code introduced or modified by this Pull Request.

Use the full file only for understanding surrounding context.

IMPORTANT:
- Report line numbers using the original full file line numbers.
- Do not report patch line numbers.
- Focus on real bugs, security problems, code-quality problems, and performance problems caused by or related to the changed code.
- Do not report unrelated existing problems unless the changed code affects them.
"""


def get_code_snippet(
    code: str,
    line: int,
    context: int = 2,
) -> str:
    lines = code.splitlines()

    if not lines:
        return ""

    try:
        line = int(line)
    except (TypeError, ValueError):
        line = 1

    target_index = max(0, min(line - 1, len(lines) - 1))
    start = max(0, target_index - context)
    end = min(len(lines), target_index + context + 1)

    snippet_lines = []

    for index in range(start, end):
        snippet_lines.append(f"{index + 1:>4} | {lines[index]}")

    return "\n".join(snippet_lines)


def run_analyzer_safely(
    analyzer,
    code: str,
    file_name: str,
    analyzer_name: str,
) -> tuple[list, str | None]:
    try:
        issues = analyzer(
            code=code,
            file_name=file_name,
        )

        if not isinstance(issues, list):
            return [], f"{analyzer_name} returned an invalid response."

        return issues, None
    except Exception as exc:
        return [], f"{analyzer_name} analysis failed: {str(exc)}"


def review_pull_request(files: list):
    all_issues = []
    file_reviews = []

    for file in files:
        file_name = file.get("file", "Unknown file")
        content = file.get("content", "")

        if not file.get("reviewable", False):
            file_reviews.append(
                {
                    "file": file_name,
                    "status": file.get("status", "unknown"),
                    "additions": file.get("additions", 0),
                    "deletions": file.get("deletions", 0),
                    "score": 100,
                    "summary": file.get(
                        "reason",
                        "File was not reviewed.",
                    ),
                    "issues": [],
                }
            )
            continue

        analyzers = get_analyzers(file_name)

        ai_result = {
            "success": True,
            "score": 100,
            "summary": "No AI review performed.",
            "issues": [],
        }

        analysis_warnings = []
        eslint_issues = []
        semgrep_issues = []

        if "ai" in analyzers:
            ai_started = time.perf_counter()
            try:
                review_input = build_review_input(file)
                result = review_code(
                    code=review_input,
                    file_name=file_name,
                )

                if isinstance(result, dict):
                    ai_result = result
                else:
                    ai_result = {
                        "success": False,
                        "score": 0,
                        "summary": "AI returned an invalid review response.",
                        "issues": [],
                    }
            except Exception as exc:
                ai_result = {
                    "success": False,
                    "score": 0,
                    "summary": f"AI review failed: {str(exc)}",
                    "issues": [],
                }
            finally:
                print(
                    f"[PR REVIEW] Gemini {file_name}: "
                    f"{time.perf_counter() - ai_started:.2f}s",
                    flush=True,
                )

            if not ai_result.get("success", False):
                analysis_warnings.append(
                    "AI review failed; findings may be incomplete."
                )

        if "eslint" in analyzers:
            eslint_started = time.perf_counter()
            eslint_issues, eslint_error = run_analyzer_safely(
                analyzer=run_eslint,
                code=content,
                file_name=file_name,
                analyzer_name="ESLint",
            )

            print(
                f"[PR REVIEW] ESLint {file_name}: "
                f"{time.perf_counter() - eslint_started:.2f}s",
                flush=True,
            )

            if eslint_error:
                analysis_warnings.append(eslint_error)

        if "semgrep" in analyzers:
            semgrep_started = time.perf_counter()
            semgrep_issues, semgrep_error = run_analyzer_safely(
                analyzer=run_semgrep,
                code=content,
                file_name=file_name,
                analyzer_name="Semgrep",
            )

            print(
                f"[PR REVIEW] Semgrep {file_name}: "
                f"{time.perf_counter() - semgrep_started:.2f}s",
                flush=True,
            )

            if semgrep_error:
                analysis_warnings.append(
                    f"{semgrep_error} Security analysis may be incomplete."
                )

        ai_issues = ai_result.get("issues", [])
        if not isinstance(ai_issues, list):
            ai_issues = []
            analysis_warnings.append("AI returned an invalid issues list.")

        file_issues = ai_issues + eslint_issues + semgrep_issues

        for issue in file_issues:
            if not isinstance(issue, dict):
                continue

            issue["file"] = issue.get("file") or file_name
            issue["title"] = issue.get("title") or "Review finding"
            issue["severity"] = str(issue.get("severity") or "low").lower()
            issue["description"] = issue.get("description") or ""
            issue["suggestion"] = issue.get("suggestion") or ""
            issue["source"] = issue.get("source") or "Unknown"
            issue["code_snippet"] = get_code_snippet(
                content,
                issue.get("line", 1),
            )

        file_issues = remove_duplicates(file_issues)
        file_score = calculate_score(file_issues)

        summary = ai_result.get("summary") or "Review completed."

        if analysis_warnings:
            summary = f"{summary} " + " ".join(analysis_warnings)

        file_reviews.append(
            {
                "file": file_name,
                "status": file.get("status", "unknown"),
                "additions": file.get("additions", 0),
                "deletions": file.get("deletions", 0),
                "score": file_score,
                "summary": summary,
                "issues": file_issues,
            }
        )

        all_issues.extend(file_issues)

    combined_issues = remove_duplicates(all_issues)
    final_score = calculate_score(combined_issues)

    return {
        "score": final_score,
        "issues": combined_issues,
        "files": file_reviews,
    }


def build_pr_review_comment(review: dict):
    lines = []

    issues = review.get("issues", [])

    lines.append("<!-- ai-code-reviewer -->")
    lines.append("# 🤖 AI Code Review")
    lines.append("")
    lines.append(f"**Overall Score:** {review.get('score', 100)}/100")
    lines.append(f"**Issues Found:** {len(issues)}")
    lines.append("")

    if not issues:
        lines.append("No issues were detected.")
    else:
        lines.append("# Issues")
        lines.append("")

        for issue in issues:
            lines.append(
                f"- **{str(issue.get('severity', 'low')).upper()}** "
                f"{issue.get('title', 'Review finding')}"
            )
            lines.append(f"  - File: `{issue.get('file', 'Unknown')}`")
            lines.append(f"  - Line: {issue.get('line', 'Unknown')}")
            lines.append(f"  - {issue.get('description', '')}")
            lines.append(
                f"  - **Suggestion:** {issue.get('suggestion', 'No suggestion provided.')}"
            )
            lines.append(f"  - Source: {issue.get('source', 'Unknown')}")
            lines.append("")

    lines.append("---")
    lines.append("Generated by **AI Code Reviewer**.")

    return "\n".join(lines)


def build_github_review_summary(review: dict):
    lines = []
    issues = review.get("issues", [])

    lines.append("<!-- ai-code-reviewer -->")
    lines.append("# AI Code Review")
    lines.append("")
    lines.append(f"**Overall Score:** {review.get('score', 100)}/100")
    lines.append(f"**Issues Found:** {len(issues)}")
    lines.append("")

    if not issues:
        lines.append("No issues were detected.")
    else:
        lines.append("## Review Summary")
        lines.append("")

        severity_counts = {}

        for issue in issues:
            severity = str(issue.get("severity", "info")).upper()

            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        for severity, count in sorted(severity_counts.items()):
            lines.append(f"- **{severity}:** {count}")

        lines.append("")
        lines.append(
            "Detailed findings are attached as inline comments on the changed lines."
        )

    lines.append("")
    lines.append("---")
    lines.append("Generated by **AI Code Reviewer**.")

    return "\n".join(lines)
