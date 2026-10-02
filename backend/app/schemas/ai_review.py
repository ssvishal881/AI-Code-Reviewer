from pydantic import BaseModel


class ReviewIssue(BaseModel):
    category: str
    severity: str
    title: str
    file: str
    line: int
    description: str
    suggestion: str
    source: str
    code_snippet: str | None = None


class AIReviewRequest(BaseModel):
    code: str
    file_name: str = "code.txt"


class AIReviewResponse(BaseModel):
    score: int
    summary: str
    issues: list[ReviewIssue]
