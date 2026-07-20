import React, { useEffect, useRef, useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import TankScene from "../components/TankScene.jsx";
import ControlPanel from "../components/ControlPanel.jsx";
import ResultPanel from "../components/ResultPanel.jsx";
import { defaultInputs, FEATURE_ORDER } from "../data/featureMeta.js";
import { api } from "../api.js";

export default function TestPage() {
  const [inputs, setInputs] = useState(defaultInputs());
  const [compoundName, setCompoundName] = useState("Custom profile");
  const [activePreset, setActivePreset] = useState(null);

  const [phase, setPhase] = useState("idle");
  const [dosing, setDosing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const timers = useRef([]);

  const busy = phase === "dosing" || phase === "analyzing" || phase === "absorbing" || phase === "xray";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runTest = () => {
    if (busy) return;
    setError(null);
    setResult(null);
    setPhase("dosing");
    setDosing(true);

    timers.current.push(
      setTimeout(() => {
        setDosing(false);
        setPhase("analyzing");
      }, 900)
    );

    timers.current.push(
      setTimeout(async () => {
        const cleanInputs = {};
        FEATURE_ORDER.forEach((f) => {
          cleanInputs[f] = inputs[f] === "" || isNaN(inputs[f]) ? 0 : Number(inputs[f]);
        });

        try {
          const payload = {
            ...cleanInputs,
            compound_name: compoundName || "Custom profile",
            cas: activePreset ? activePreset.cas : null,
            source: activePreset ? "dataset" : "custom",
            true_class: activePreset ? activePreset.trueClass : null,
          };
          const r = await api.predict(payload);
          setResult({ ...r, inputs: cleanInputs });

          if (r.prediction === "safe") {
            setPhase("safe");
          } else {
            setPhase("absorbing");
            timers.current.push(setTimeout(() => setPhase("xray"), 900));
            timers.current.push(setTimeout(() => setPhase("dead"), 900 + 1500));
          }
        } catch (e) {
          setError(e.message || "Prediction failed — is the backend running on port 8000?");
          setPhase("idle");
        }
      }, 900 + 650)
    );
  };

  const resetTank = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("idle");
    setDosing(false);
  };

  return (
    <div className="test-grid">
      <div className="tank-col">
        <TankScene phase={phase} dosing={dosing} />
        <div className="tank-actions">
          <button className="btn-primary" disabled={busy} onClick={runTest}>
            <FlaskConical size={16} /> {busy ? "Testing…" : "Run test"}
          </button>
          {(phase === "safe" || phase === "dead") && (
            <button className="btn-ghost" onClick={resetTank}>
              <RotateCcw size={15} /> Reset tank
            </button>
          )}
        </div>
        {error && <div className="organ-note" style={{ borderColor: "rgba(255,93,93,0.4)" }}>{error}</div>}
        <ResultPanel result={result} compoundName={compoundName} activePreset={activePreset} onReset={resetTank} phase={phase} />
      </div>

      <ControlPanel
        inputs={inputs}
        setInputs={setInputs}
        compoundName={compoundName}
        setCompoundName={setCompoundName}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
        busy={busy}
      />
    </div>
  );
}
