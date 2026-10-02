from fastapi import APIRouter

from app.schemas.ai_review import AIReviewRequest
from app.services.semgrep_analyzer import run_semgrep

router = APIRouter(
    prefix="/semgrep",
    tags=["Semgrep"],
)


@router.post("/")
def analyze_with_semgrep(data: AIReviewRequest):
    issues = run_semgrep(
        code=data.code,
        file_name=data.file_name,
    )

    return {
        "file_name": data.file_name,
        "issues": issues,
        "count": len(issues),
    }
