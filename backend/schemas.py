"""Pydantic request/response models for the AquaTox AI API."""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PredictRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    compound_name: Optional[str] = "Custom profile"
    cas: Optional[str] = None
    source: Optional[str] = "custom"     # "dataset" | "custom"
    true_class: Optional[int] = None      # ground-truth class, only set for real dataset compounds

    nHM: float
    piPC09: float
    PCD: float
    X2Av: float
    MLOGP: float
    ON1V: float
    n072: float = Field(..., alias="N-072")
    b02cn: float = Field(..., alias="B02[C-N]")
    f04co: float = Field(..., alias="F04[C-O]")

    def to_feature_dict(self):
        return {
            "nHM": self.nHM, "piPC09": self.piPC09, "PCD": self.PCD, "X2Av": self.X2Av,
            "MLOGP": self.MLOGP, "ON1V": self.ON1V,
            "N-072": self.n072, "B02[C-N]": self.b02cn, "F04[C-O]": self.f04co,
        }


class FactorOut(BaseModel):
    feature: str
    contribution: float


class PredictResponse(BaseModel):
    id: int
    probability: float
    prediction: str
    top_factors: List[FactorOut]
    timestamp: str
