from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    user_id: int,
    db: Session = Depends(get_db),
):
    review = Review(
        user_id=user_id,
        score=review_data.score,
        summary=review_data.summary,
        status=review_data.status,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review


@router.get("/", response_model=list[ReviewResponse])
def get_reviews(db: Session = Depends(get_db)):
    reviews = db.query(Review).all()

    return reviews


@router.get("/user/{user_id}", response_model=list[ReviewResponse])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return reviews


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    return review
