from fastapi import APIRouter

from ..services.ml_service import ml_service

router = APIRouter()


@router.get("/model-info")
def model_info():
    return ml_service.metadata
