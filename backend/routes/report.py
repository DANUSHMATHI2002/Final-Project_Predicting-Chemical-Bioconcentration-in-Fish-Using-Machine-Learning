import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import PredictionRecord
from ..services.ml_service import ml_service
from ..services.report_service import build_csv_export, build_pdf_report

router = APIRouter()


@router.get("/report/history/csv")
def download_csv(db: Session = Depends(get_db)):
    rows = db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).all()
    csv_bytes = build_csv_export(rows)
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fish-toxicity-history.csv"},
    )


@router.get("/report/{record_id}")
def download_report(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    pdf_bytes = build_pdf_report(record, ml_service.metadata.get("deployed_model", "the deployed model"))
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fish-toxicity-report-{record_id}.pdf"},
    )
