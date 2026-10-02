from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.review import Review
from app.schemas.ai_review import AIReviewRequest, AIReviewResponse
from app.services.ai_reviewer import review_code
from app.services.static_analyzer import run_eslint
from app.services.semgrep_analyzer import run_semgrep
from app.services.review_processor import calculate_score, remove_duplicates

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
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    ai_result = review_code(
        data.code,
        data.file_name,
    )

    eslint_issues = run_eslint(
        code=data.code,
        file_name=data.file_name,
    )

    semgrep_issues = run_semgrep(
        code=data.code,
        file_name=data.file_name,
    )

    all_issues = ai_result["issues"] + eslint_issues + semgrep_issues

    for issue in all_issues:
        issue["code_snippet"] = get_code_snippet(
            data.code,
            issue["line"],
        )

    combined_issues = remove_duplicates(all_issues)

    final_score = calculate_score(combined_issues)

    review = Review(
        user_id=user_id,
        score=final_score,
        summary=ai_result["summary"],
        issues=combined_issues,
        status="completed",
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "score": final_score,
        "summary": ai_result["summary"],
        "issues": combined_issues,
    }
