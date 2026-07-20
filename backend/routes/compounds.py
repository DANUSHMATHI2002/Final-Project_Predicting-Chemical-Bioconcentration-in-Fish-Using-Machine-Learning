from fastapi import APIRouter, Query

from ..services.ml_service import FEATURE_COLS, ml_service

router = APIRouter()

# Curated, recognisable real compounds pulled directly from the training CSV
CURATED = [
    {"name": "DDT", "cas": "50-29-3"},
    {"name": "Benzene", "cas": "71-43-2"},
    {"name": "Bisphenol A", "cas": "80-05-7"},
    {"name": "Naphthalene", "cas": "91-20-3"},
    {"name": "Atrazine", "cas": "1912-24-9"},
    {"name": "4-Nitrophenol", "cas": "100-02-7"},
    {"name": "Glyphosate", "cas": "1071-83-6"},
    {"name": "Lindane", "cas": "608-73-1"},
]


@router.get("/compounds/presets")
def presets():
    out = []
    df = ml_service.compounds_df
    for c in CURATED:
        row = df[df["CAS"] == c["cas"]]
        if len(row):
            r = row.iloc[0]
            out.append({
                "name": c["name"],
                "cas": c["cas"],
                "true_class": int(r["Class"]),
                "values": {f: float(r[f]) for f in FEATURE_COLS},
            })
    return out


@router.get("/compounds/search")
def search(q: str = Query("", description="Search by CAS number or SMILES substring"), limit: int = 20):
    """Lets the UI offer 'search another compound' across all 779 real
    training-set chemicals, not just the 8 curated presets."""
    return ml_service.search_compounds(q, limit)
