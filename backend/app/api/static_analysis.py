from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.ai_review import AIReviewRequest
from app.services.static_analyzer import run_eslint

router = APIRouter(
    prefix="/static-analysis",
    tags=["Static Analysis"],
)


@router.post("/")
def analyze_code(
    data: AIReviewRequest,
    current_user: User = Depends(get_current_user),
):
    issues = run_eslint(
        file_name=data.file_name,
        code=data.code,
    )

    return {
        "file_name": data.file_name,
        "issues": issues,
        "count": len(issues),
    }
