"""ORM model for a single stored prediction / test run."""
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String

from .db import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    compound_name = Column(String, default="Custom profile")
    cas = Column(String, nullable=True)
    source = Column(String, default="custom")  # "dataset" | "custom"
    inputs = Column(JSON)
    probability = Column(Float)          # P(dangerous), from the deployed model (see model_metadata.json)
    prediction = Column(String)          # "safe" | "dangerous"
    top_factors = Column(JSON)           # SHAP-derived top contributing descriptors
    true_class = Column(Integer, nullable=True)  # dataset ground-truth class, if known
