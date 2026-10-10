from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.database import get_db
from app.models.review import Review
from app.schemas.ai_review import AIReviewRequest, AIReviewResponse
from app.services.ai_reviewer import review_code
from app.services.static_analyzer import run_eslint
from app.services.semgrep_analyzer import run_semgrep
from app.services.review_processor import calculate_score, remove_duplicates
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/ai-review",
    tags=["AI Review"],
)


def get_code_snippet(
    code: str,
    line: int,
    context: int = 2,
) -> str:
    lines = code.splitlines()

    if not lines:
        return ""

    target_index = max(0, line - 1)

    start = max(0, target_index - context)
    end = min(len(lines), target_index + context + 1)

    snippet_lines = []

    for index in range(start, end):
        snippet_lines.append(f"{index + 1:>4} | {lines[index]}")

    return "\n".join(snippet_lines)


@router.post("/", response_model=AIReviewResponse)
def create_ai_review(
    data: AIReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        ai_result = review_code(data.code, data.file_name)
        print("AI review result:", ai_result, flush=True)
    except Exception as exc:
        print(f"AI REVIEW EXCEPTION: {type(exc).__name__}: {exc}", flush=True)
        raise HTTPException(
            status_code=503,
            detail=f"AI review failed: {exc}",
        ) from exc

    try:
        eslint_issues = run_eslint(
            code=data.code,
            file_name=data.file_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"ESLint analysis failed: {exc}",
        ) from exc

    semgrep_error = None
    try:
        semgrep_issues = run_semgrep(
            code=data.code,
            file_name=data.file_name,
        )
    except Exception as exc:
        semgrep_issues = []
        semgrep_error = str(exc)

    all_issues = ai_result["issues"] + eslint_issues + semgrep_issues

    for issue in all_issues:
        issue["code_snippet"] = get_code_snippet(
            data.code,
            issue.get("line", 1),
        )

    combined_issues = remove_duplicates(all_issues)

    ai_summary = ai_result.get("summary", "")
    ai_failed = not ai_result.get("success", False)

    if ai_failed and not combined_issues:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI review failed and static analyzers found no issues. "
                "A reliable review score could not be calculated."
            ),
        )

    final_score = calculate_score(combined_issues)

    if ai_failed:
        summary = (
            "AI review unavailable. Score is based on static analysis findings only."
        )
    else:
        summary = ai_summary

    if semgrep_error:
        summary += (
            " Semgrep analysis was unavailable for this review; "
            "security analysis may be incomplete."
        )

    review = Review(
        user_id=current_user.id,
        score=final_score,
        summary=summary,
        issues=combined_issues,
        status="completed",
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "score": final_score,
        "summary": summary,
        "issues": combined_issues,
    }
