from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import PredictionRecord
from ..schemas import PredictRequest, PredictResponse
from ..services.ml_service import ml_service

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, db: Session = Depends(get_db)):
    inputs = payload.to_feature_dict()
    result = ml_service.predict(inputs)

    record = PredictionRecord(
        timestamp=datetime.utcnow(),
        compound_name=payload.compound_name or "Custom profile",
        cas=payload.cas,
        source=payload.source or "custom",
        inputs=inputs,
        probability=result["probability"],
        prediction=result["prediction"],
        top_factors=result["top_factors"],
        true_class=payload.true_class,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "probability": result["probability"],
        "prediction": result["prediction"],
        "top_factors": result["top_factors"],
        "timestamp": record.timestamp.isoformat(),
    }
