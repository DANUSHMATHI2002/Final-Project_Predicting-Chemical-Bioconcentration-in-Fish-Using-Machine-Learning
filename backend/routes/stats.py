from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import PredictionRecord

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    rows = db.query(PredictionRecord).all()
    total = len(rows)
    dangerous = sum(1 for r in rows if r.prediction == "dangerous")
    safe = total - dangerous
    avg_confidence = (
        sum((r.probability if r.prediction == "dangerous" else 1 - r.probability) for r in rows) / total * 100
        if total else 0.0
    )

    freq = {}
    for r in rows:
        freq[r.compound_name] = freq.get(r.compound_name, 0) + 1
    top_compounds = sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:8]

    confidence_trend = [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "confidence": round((r.probability if r.prediction == "dangerous" else 1 - r.probability) * 100, 1),
        }
        for r in sorted(rows, key=lambda r: r.timestamp)[-30:]
    ]

    return {
        "total": total,
        "safe": safe,
        "dangerous": dangerous,
        "avg_confidence": avg_confidence,
        "top_compounds": [{"name": k, "count": v} for k, v in top_compounds],
        "confidence_trend": confidence_trend,
    }
