import React from "react";
import { AlertTriangle, CheckCircle2, Download, Droplets, RotateCcw } from "lucide-react";
import { affectedOrgans, classToLabel, FEATURE_META, ORGAN_LABEL } from "../data/featureMeta.js";
import { api } from "../api.js";

export default function ResultPanel({ result, compoundName, activePreset, onReset, phase }) {
  if (!result) {
    return (
      <div className="result-panel result-empty">
        <Droplets size={28} />
        <p>Choose a real compound, search for another, or set your own molecular profile — then run the test to see the tank react.</p>
      </div>
    );
  }

  const isDangerous = result.prediction === "dangerous";
  const confidence = (isDangerous ? result.probability : 1 - result.probability) * 100;
  const settled = phase === "safe" || phase === "dead";
  const organs = affectedOrgans(result.inputs, result.prediction);

  return (
    <div className={"result-panel " + (isDangerous ? "result-danger" : "result-safe")}>
      <div className="result-head">
        {isDangerous ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        <div>
          <div className="verdict">{isDangerous ? "TOXIC" : "SAFE"}</div>
          <div className="verdict-sub">{compoundName || "Custom molecular profile"}</div>
        </div>
        <div className="confidence-badge">
          {confidence.toFixed(1)}%<span>confidence</span>
        </div>
      </div>

      <p className="result-note">
        {isDangerous
          ? "This molecular profile matches the pattern the deployed model associates with elevated fish-bioaccumulation risk. Flagged as a priority for exposure limitation and further ecotoxicological testing."
          : "This molecular profile falls within the range the model associates with low fish-bioaccumulation risk under standard exposure."}
      </p>

      {isDangerous && settled && organs.length > 0 && (
        <div className="organ-note">
          <strong>Illustrative affected pathways:</strong> {organs.map((o) => ORGAN_LABEL[o]).join(", ")}.
          <span className="organ-note-sub">
            {" "}
            Gills are the entry route and liver the main metabolizing organ; kidneys/heart are flagged here for high fat-affinity or
            heavy-atom profiles. This mapping is an educational visualization, not a separate trained prediction.
          </span>
        </div>
      )}

      <div className="factors">
        <div className="factors-title">What drove this result (SHAP)</div>
        {(() => {
          const top3 = result.top_factors.slice(0, 3);
          const maxAbs = Math.max(...top3.map((c) => Math.abs(c.contribution)), 1e-9);
          return top3.map((c) => (
            <div key={c.feature} className="factor-row">
              <span className="factor-name">{FEATURE_META[c.feature].label}</span>
              <div className="factor-bar-track">
                <div
                  className={"factor-bar " + (c.contribution > 0 ? "factor-danger" : "factor-safe")}
                  style={{ width: `${(Math.abs(c.contribution) / maxAbs) * 100}%` }}
                />
              </div>
              <span className="factor-dir">{c.contribution > 0 ? "→ toxic" : "→ safe"}</span>
            </div>
          ));
        })()}
      </div>

      {activePreset && (
        <div className={"ground-truth " + (classToLabel(activePreset.trueClass) === result.prediction ? "gt-agree" : "gt-disagree")}>
          <span>
            Dataset label: Class {activePreset.trueClass} → <strong>{classToLabel(activePreset.trueClass) === "dangerous" ? "Dangerous" : "Safe"}</strong>
          </span>
          <span>{classToLabel(activePreset.trueClass) === result.prediction ? "✓ model agrees" : "⚠ model disagrees — the model is ~80–83% accurate, not perfect"}</span>
        </div>
      )}

      <div className="result-actions">
        <a href={api.reportUrl(result.id)} target="_blank" rel="noreferrer">
          <Download size={15} /> Download PDF report
        </a>
        {settled && (
          <button onClick={onReset}>
            <RotateCcw size={15} /> Run another test
          </button>
        )}
      </div>
    </div>
  );
}
