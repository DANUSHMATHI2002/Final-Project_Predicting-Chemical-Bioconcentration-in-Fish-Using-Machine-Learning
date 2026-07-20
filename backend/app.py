"""
app.py — FastAPI entrypoint for AquaTox AI.

Run from the project root:
    uvicorn backend.app:app --reload --port 8000

API docs will be available at http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.db import Base, engine
from .routes import compounds, history, model_info, predict, report, stats
from .services.ml_service import ml_service

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaTox AI — Fish Toxicity Prediction API",
    description="Serves real predictions from a GridSearchCV-tuned model (auto-selected for highest F1 among Logistic Regression / Random Forest / XGBoost) trained on the QSAR fish bioconcentration dataset.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api", tags=["predict"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
app.include_router(compounds.router, prefix="/api", tags=["compounds"])
app.include_router(model_info.router, prefix="/api", tags=["model"])
app.include_router(report.router, prefix="/api", tags=["report"])


@app.get("/api/health")
def health():
    return {"status": "ok", "model": ml_service.metadata.get("deployed_model", "unknown"), "deployed": True}
