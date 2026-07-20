import React, { useEffect, useState } from "react";
import { Activity, Fish as FishIcon, Info } from "lucide-react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api.js";

export default function ModelInfo() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getModelInfo().then(setMeta).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-state"><p>{error}</p></div>;
  if (!meta) return <div className="loading-state"><Info size={24} /><p>Loading model info…</p></div>;

  const modelNames = Object.keys(meta.metrics_summary);
  const metricKeys = ["Accuracy", "Precision", "Recall", "F1", "ROC_AUC", "PR_AUC"];
  const bestPerMetric = {};
  metricKeys.forEach((k) => {
    bestPerMetric[k] = modelNames.reduce((best, m) => (meta.metrics_summary[m][k] > meta.metrics_summary[best][k] ? m : best), modelNames[0]);
  });

  const importanceData = Object.entries(meta.feature_importance)
    .sort((a, b) => b[1] - a[1])
    .map(([feature, value]) => ({ feature, value }));

  return (
    <div className="model-info">
      <div className="panel-card">
        <div className="panel-title"><Info size={16} /> Dataset &amp; task</div>
        <p className="panel-sub">
          {meta.class_balance.total} chemicals, each described by {meta.feature_cols.length} Dragon molecular descriptors computed from
          structure (SMILES). The target is a binary bioaccumulation-risk label derived from the dataset's own 3-class scheme: Class 1 &amp; 2
          → <strong>Dangerous</strong> ({meta.class_balance.dangerous} chemicals, {(meta.class_balance.dangerous / meta.class_balance.total * 100).toFixed(0)}%),
          Class 3 → <strong>Safe</strong> ({meta.class_balance.safe} chemicals, {(meta.class_balance.safe / meta.class_balance.total * 100).toFixed(0)}%).
        </p>
        <p className="panel-sub">
          Pipeline: <code>StandardScaler → SMOTE → Classifier</code>, fit inside each fold of a stratified 5-fold <code>GridSearchCV</code> (scored
          on F1) on an 80/20 stratified train/test split.
        </p>
      </div>

      <div className="panel-card">
        <div className="panel-title"><Activity size={16} /> Model comparison (held-out test set)</div>
        <div className="metrics-table">
          <div className="metrics-row metrics-head">
            <span>Model</span>
            {metricKeys.map((k) => <span key={k}>{k.replace("_", "-")}</span>)}
          </div>
          {modelNames.map((m) => (
            <div key={m} className={"metrics-row " + (m === meta.deployed_model ? "metrics-deployed" : "")}>
              <span>{m}{m === meta.deployed_model && <span className="deployed-tag">deployed</span>}</span>
              {metricKeys.map((k) => (
                <span key={k} className={bestPerMetric[k] === m ? "best-metric" : ""}>{meta.metrics_summary[m][k].toFixed(3)}</span>
              ))}
            </div>
          ))}
        </div>
        <p className="panel-sub" style={{ marginTop: 12 }}>
          <strong>{meta.deployed_model}</strong> is loaded server-side from a real pickled scikit-learn pipeline
          (<code>model/saved_model_deployed.pkl</code>) and runs on every request through this API — every prediction you see is that exact fitted
          model's <code>predict_proba()</code>, not a simulation. It was auto-selected because it scored highest F1 among all three candidates on
          the held-out test set (see table above) — the same script would deploy a different model if retraining ever produced a different
          winner. Per-prediction explanations come from a matching SHAP explainer over that same model.
        </p>
      </div>

      <div className="panel-card">
        <div className="panel-title"><FishIcon size={16} /> What {meta.deployed_model} found most important</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={importanceData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis type="number" tick={{ fill: "#9fc1d0", fontSize: 11 }} />
            <YAxis type="category" dataKey="feature" tick={{ fill: "#9fc1d0", fontSize: 12 }} width={80} />
            <Tooltip contentStyle={{ background: "#0b2a43", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eaf6fa" }} />
            <Bar dataKey="value" fill="#5eead4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel-card disclaimer-card">
        <p>Educational / portfolio demo built from your own trained pipeline. Not a substitute for regulatory ecotoxicological assessment.</p>
      </div>
    </div>
  );
}
