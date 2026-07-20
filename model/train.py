"""
train.py — reproduces the exact modeling pipeline from the original notebook
(Fish_Project__5_.ipynb) on Fish_concentration.csv, and saves the fitted
models + scaler to disk so the FastAPI backend can load real, trained
artifacts instead of retraining on every request.

Pipeline (identical to the notebook):
    StandardScaler -> SMOTE -> Classifier
    fit inside each fold of a 5-fold StratifiedKFold GridSearchCV, scored on F1
    80/20 stratified train/test split, random_state=42

Models: Logistic Regression, Random Forest, XGBoost
Deployed model: whichever of the three scores highest F1 on the held-out
test set — selected automatically at the end of this script, not hardcoded.
"""

import json
import os
import warnings

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, average_precision_score,
                              confusion_matrix, f1_score, precision_score,
                              precision_recall_curve, recall_score,
                              roc_auc_score)
from sklearn.model_selection import (GridSearchCV, StratifiedKFold,
                                      train_test_split)
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "..", "dataset", "Fish_concentration.csv")
OUT_DIR = HERE

FEATURE_COLS = ["nHM", "piPC09", "PCD", "X2Av", "MLOGP", "ON1V", "N-072", "B02[C-N]", "F04[C-O]"]


def load_data():
    df = pd.read_csv(DATA_PATH)
    df["is_dangerous"] = df["Class"].apply(lambda x: 1 if x in [1, 2] else 0)
    X = df[FEATURE_COLS]
    y = df["is_dangerous"]
    return df, X, y


def make_pipeline(classifier):
    """scale -> SMOTE -> model, all fitted inside each CV fold (no leakage)."""
    return ImbPipeline([
        ("scaler", StandardScaler()),
        ("smote", SMOTE(random_state=42)),
        ("clf", classifier),
    ])


def evaluate(name, gridsearch, X_test, y_test, results):
    best = gridsearch.best_estimator_
    y_pred = best.predict(X_test)
    y_proba = best.predict_proba(X_test)[:, 1]
    pr_auc = average_precision_score(y_test, y_proba)
    results[name] = {
        "model": best,
        "best_params": gridsearch.best_params_,
        "cv_f1": float(gridsearch.best_score_),
        "Accuracy": float(accuracy_score(y_test, y_pred)),
        "Precision": float(precision_score(y_test, y_pred)),
        "Recall": float(recall_score(y_test, y_pred)),
        "F1": float(f1_score(y_test, y_pred)),
        "ROC_AUC": float(roc_auc_score(y_test, y_proba)),
        "PR_AUC": float(pr_auc),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    print(f"[{name}] best params: {gridsearch.best_params_}")
    print(f"[{name}] F1={results[name]['F1']:.4f} "
          f"Acc={results[name]['Accuracy']:.4f} "
          f"Prec={results[name]['Precision']:.4f} "
          f"Rec={results[name]['Recall']:.4f} "
          f"ROC-AUC={results[name]['ROC_AUC']:.4f} "
          f"PR-AUC={results[name]['PR_AUC']:.4f}")


def main():
    df, X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    results = {}

    # ---- Logistic Regression ----
    lr_pipe = make_pipeline(LogisticRegression(max_iter=2000, solver="liblinear", random_state=42))
    lr_grid = {"clf__C": [0.01, 0.1, 1, 10], "clf__penalty": ["l1", "l2"]}
    lr_search = GridSearchCV(lr_pipe, lr_grid, scoring="f1", cv=cv, n_jobs=-1)
    lr_search.fit(X_train, y_train)
    evaluate("Logistic Regression", lr_search, X_test, y_test, results)

    # ---- Random Forest ----
    rf_pipe = make_pipeline(RandomForestClassifier(random_state=42, n_jobs=-1))
    rf_grid = {
        "clf__n_estimators": [200, 400],
        "clf__max_depth": [None, 10, 20],
        "clf__min_samples_leaf": [1, 2, 4],
        "clf__max_features": ["sqrt"],
    }
    rf_search = GridSearchCV(rf_pipe, rf_grid, scoring="f1", cv=cv, n_jobs=-1)
    rf_search.fit(X_train, y_train)
    evaluate("Random Forest", rf_search, X_test, y_test, results)

    # ---- XGBoost (comparison only, not deployed) ----
    try:
        import xgboost as xgb
        xgb_pipe = make_pipeline(xgb.XGBClassifier(random_state=42, eval_metric="logloss",
                                                     tree_method="hist", n_jobs=-1))
        xgb_grid = {
            "clf__n_estimators": [200, 400], "clf__max_depth": [3, 5],
            "clf__learning_rate": [0.05, 0.1], "clf__subsample": [0.8, 1.0],
            "clf__colsample_bytree": [0.8, 1.0],
        }
        xgb_search = GridSearchCV(xgb_pipe, xgb_grid, scoring="f1", cv=cv, n_jobs=-1)
        xgb_search.fit(X_train, y_train)
        evaluate("XGBoost", xgb_search, X_test, y_test, results)
    except ImportError:
        print("xgboost not installed — skipping (optional, comparison only)")

    # ---- Auto-select the deployed model: whichever scored highest F1 ----
    # (F1 is the metric this whole pipeline was tuned on via GridSearchCV,
    # so it's the fair, consistent way to pick a single "winner" instead of
    # a hardcoded choice that can silently go stale as the data/params change.)
    deployed_name = max(results, key=lambda n: results[n]["F1"])
    deployed_pipeline = results[deployed_name]["model"]

    joblib.dump(deployed_pipeline, os.path.join(OUT_DIR, "saved_model_deployed.pkl"))
    # also keep each individual model on disk for reference / comparison
    joblib.dump(results["Logistic Regression"]["model"], os.path.join(OUT_DIR, "saved_model_lr.pkl"))
    joblib.dump(results["Random Forest"]["model"], os.path.join(OUT_DIR, "saved_model_rf.pkl"))
    if "XGBoost" in results:
        joblib.dump(results["XGBoost"]["model"], os.path.join(OUT_DIR, "saved_model_xgb.pkl"))

    scaler = StandardScaler().fit(X_train)
    joblib.dump(scaler, os.path.join(OUT_DIR, "scaler.pkl"))

    # Feature importance from whichever model actually got deployed (not always RF —
    # tree models expose .feature_importances_, linear models fall back to |coef|).
    deployed_clf = deployed_pipeline.named_steps["clf"]
    if hasattr(deployed_clf, "feature_importances_"):
        importance_values = deployed_clf.feature_importances_.tolist()
    elif hasattr(deployed_clf, "coef_"):
        importance_values = np.abs(deployed_clf.coef_[0]).tolist()
    else:
        importance_values = [0.0] * len(FEATURE_COLS)
    feature_importance = dict(zip(FEATURE_COLS, importance_values))

    feature_stats = {}
    for f in FEATURE_COLS:
        feature_stats[f] = {
            "min": float(X[f].min()), "max": float(X[f].max()),
            "mean": float(X[f].mean()), "median": float(X[f].median()),
            "std": float(X[f].std()),
        }

    metadata = {
        "feature_cols": FEATURE_COLS,
        "deployed_model": deployed_name,
        "deployed_model_file": "saved_model_deployed.pkl",
        "selection_rule": "highest F1 on the held-out test set, among all successfully trained models",
        "class_balance": {
            "safe": int((y == 0).sum()), "dangerous": int((y == 1).sum()), "total": int(len(y))
        },
        "metrics_summary": {
            name: {k: v for k, v in r.items() if k in
                   ["Accuracy", "Precision", "Recall", "F1", "ROC_AUC", "PR_AUC", "best_params", "confusion_matrix"]}
            for name, r in results.items()
        },
        "feature_importance": feature_importance,
        "feature_stats": feature_stats,
        "trained_at": pd.Timestamp.now().isoformat(),
    }
    with open(os.path.join(OUT_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nSaved: saved_model_deployed.pkl (+ individual saved_model_lr/rf/xgb.pkl), scaler.pkl, model_metadata.json")
    print(f"Deployed model: {deployed_name}  (F1={results[deployed_name]['F1']:.4f})")


if __name__ == "__main__":
    main()
