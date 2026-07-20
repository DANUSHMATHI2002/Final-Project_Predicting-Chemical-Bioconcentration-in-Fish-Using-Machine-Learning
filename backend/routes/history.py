from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import PredictionRecord

router = APIRouter()


def _row_to_dict(r: PredictionRecord):
    return {
        "id": r.id,
        "timestamp": r.timestamp.isoformat(),
        "compound_name": r.compound_name,
        "cas": r.cas,
        "source": r.source,
        "inputs": r.inputs,
        "probability": r.probability,
        "prediction": r.prediction,
        "top_factors": r.top_factors,
        "true_class": r.true_class,
    }


@router.get("/history")
def get_history(limit: int = 500, db: Session = Depends(get_db)):
    rows = db.query(PredictionRecord).order_by(desc(PredictionRecord.timestamp)).limit(limit).all()
    return [_row_to_dict(r) for r in rows]


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(PredictionRecord).delete()
    db.commit()
    return {"status": "cleared"}


@router.delete("/history/{record_id}")
def delete_one(record_id: int, db: Session = Depends(get_db)):
    db.query(PredictionRecord).filter(PredictionRecord.id == record_id).delete()
    db.commit()
    return {"status": "deleted"}
