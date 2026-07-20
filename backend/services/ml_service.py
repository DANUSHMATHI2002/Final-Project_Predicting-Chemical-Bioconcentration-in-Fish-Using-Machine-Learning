"""
ml_service.py — loads the actual trained model artifacts produced by
model/train.py and serves real predictions. Nothing here is randomised or
mocked: the deployed pipeline (StandardScaler -> the classifier that scored
highest F1 among Logistic Regression / Random Forest / XGBoost — see
model_metadata.json for which one) is loaded from disk and its
predict_proba() is called directly. Per-prediction explanations come from a
SHAP TreeExplainer over that same fitted model.
"""
import json
import os

import joblib
import numpy as np
import pandas as pd
import shap

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.normpath(os.path.join(HERE, "..", "..", "model"))
DATASET_PATH = os.path.normpath(os.path.join(HERE, "..", "..", "dataset", "Fish_concentration.csv"))

FEATURE_COLS = ["nHM", "piPC09", "PCD", "X2Av", "MLOGP", "ON1V", "N-072", "B02[C-N]", "F04[C-O]"]


class MLService:
    def __init__(self):
        model_path = os.path.join(MODEL_DIR, "saved_model_deployed.pkl")
        meta_path = os.path.join(MODEL_DIR, "model_metadata.json")

        if not os.path.exists(model_path):
            raise RuntimeError(
                f"No trained model found at {model_path}. Run `python model/train.py` first."
            )

        self.pipeline = joblib.load(model_path)          # imblearn Pipeline: scaler -> smote -> clf
        self.scaler = self.pipeline.named_steps["scaler"]
        self.clf = self.pipeline.named_steps["clf"]       # fitted classifier — RF, XGBoost, or LR

        with open(meta_path) as f:
            self.metadata = json.load(f)

        self.compounds_df = pd.read_csv(DATASET_PATH)
        self.compounds_df["is_dangerous"] = self.compounds_df["Class"].apply(lambda x: 1 if x in [1, 2] else 0)

        # Tree-based models (RandomForestClassifier, XGBClassifier) get a fast, exact
        # TreeExplainer. Anything else (e.g. LogisticRegression, if a future retrain
        # picks it) falls back to a LinearExplainer with a small real background
        # sample — so explanations keep working no matter which model wins F1.
        if hasattr(self.clf, "feature_importances_"):
            self.explainer = shap.TreeExplainer(self.clf)
            self._explainer_kind = "tree"
        else:
            background = self.scaler.transform(
                self.compounds_df[FEATURE_COLS].sample(min(50, len(self.compounds_df)), random_state=42)
            )
            self.explainer = shap.LinearExplainer(self.clf, background)
            self._explainer_kind = "linear"

    def predict(self, inputs: dict):
        row = pd.DataFrame([[float(inputs[f]) for f in FEATURE_COLS]], columns=FEATURE_COLS)
        x_scaled = self.scaler.transform(row)

        proba = self.clf.predict_proba(x_scaled)[0]     # [P(safe), P(dangerous)]
        prob_dangerous = float(proba[1])
        prediction = "dangerous" if prob_dangerous >= 0.5 else "safe"

        shap_values = self.explainer.shap_values(x_scaled)
        if self._explainer_kind == "tree":
            shap_arr = np.array(shap_values)
            if shap_arr.ndim == 3:
                # per-class SHAP values (e.g. sklearn RandomForestClassifier): take the "dangerous" class
                contribs = shap_arr[0, :, 1]
            else:
                # single-output SHAP values (e.g. XGBoost's binary margin output)
                contribs = shap_arr[0, :]
        else:
            contribs = np.array(shap_values)[0, :]

        factors = sorted(
            [{"feature": f, "contribution": float(c)} for f, c in zip(FEATURE_COLS, contribs)],
            key=lambda d: abs(d["contribution"]),
            reverse=True,
        )
        return {"probability": prob_dangerous, "prediction": prediction, "top_factors": factors}

    def search_compounds(self, q: str = "", limit: int = 20):
        df = self.compounds_df
        if q:
            q_low = q.strip().lower()
            mask = (
                df["CAS"].astype(str).str.lower().str.contains(q_low, na=False)
                | df["SMILES"].astype(str).str.lower().str.contains(q_low, na=False)
            )
            df = df[mask]
        df = df.head(limit)
        out = []
        for _, r in df.iterrows():
            out.append({
                "cas": r["CAS"],
                "smiles": r["SMILES"],
                "true_class": int(r["Class"]),
                "values": {f: float(r[f]) for f in FEATURE_COLS},
            })
        return out

    def feature_stats(self):
        return self.metadata.get("feature_stats", {})


ml_service = MLService()
