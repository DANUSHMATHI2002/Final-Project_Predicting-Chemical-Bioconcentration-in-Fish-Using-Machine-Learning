import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, FlaskConical, Search } from "lucide-react";
import { api } from "../api.js";
import { FEATURE_META, FEATURE_ORDER } from "../data/featureMeta.js";

function InputRow({ fkey, value, onChange, disabled }) {
  const meta = FEATURE_META[fkey];
  const numeric = value === "" ? NaN : Number(value);
  const outOfRange = !isNaN(numeric) && (numeric < meta.min || numeric > meta.max);
  return (
    <div className="input-row">
      <div className="input-row-top">
        <label>
          <span className="input-label">{meta.label}</span>
          <span className="input-symbol">{fkey}</span>
        </label>
        <input
          type="number"
          step={meta.step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(fkey, e.target.value === "" ? "" : Number(e.target.value))}
          className="num-input"
        />
      </div>
      {meta.binary ? (
        <div className="binary-toggle">
          <button type="button" disabled={disabled} className={value === 0 ? "active" : ""} onClick={() => onChange(fkey, 0)}>0 · absent</button>
          <button type="button" disabled={disabled} className={value === 1 ? "active" : ""} onClick={() => onChange(fkey, 1)}>1 · present</button>
        </div>
      ) : (
        <input
          type="range"
          min={meta.min}
          max={meta.max}
          step={meta.step}
          disabled={disabled}
          value={isNaN(numeric) ? meta.min : numeric}
          onChange={(e) => onChange(fkey, Number(e.target.value))}
          className="range-input"
        />
      )}
      <p className="input-desc">{meta.desc}</p>
      {outOfRange && (
        <p className="input-warn">
          <AlertTriangle size={12} /> Outside the training data range — prediction may be less reliable.
        </p>
      )}
    </div>
  );
}

export default function ControlPanel({ inputs, setInputs, compoundName, setCompoundName, activePreset, setActivePreset, busy }) {
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mode, setMode] = useState("preset"); // "preset" | "search" | "custom"

  useEffect(() => {
    api
      .getPresets()
      .then(setPresets)
      .catch(() => setPresets([]))
      .finally(() => setLoadingPresets(false));
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchCompounds(query).then(setSearchResults).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const selectPreset = (p) => {
    if (busy) return;
    setActivePreset({ name: p.name, cas: p.cas, trueClass: p.true_class, source: "dataset" });
    setCompoundName(p.name);
    setInputs({ ...p.values });
    setMode("preset");
  };

  const selectSearchResult = (r) => {
    if (busy) return;
    setActivePreset({ name: `Compound ${r.cas}`, cas: r.cas, trueClass: r.true_class, source: "dataset" });
    setCompoundName(`Compound (CAS ${r.cas})`);
    setInputs({ ...r.values });
  };

  const selectOther = () => {
    if (busy) return;
    setActivePreset(null);
    setCompoundName("Custom profile");
    setMode("custom");
  };

  const onManualChange = (fkey, val) => {
    if (busy) return;
    setActivePreset(null);
    setInputs((prev) => ({ ...prev, [fkey]: val }));
  };

  return (
    <div className="control-col">
      <div className="panel-card">
        <div className="panel-title">
          <FlaskConical size={16} /> Real compounds from the training set
        </div>
        <p className="panel-sub">Actual rows from Fish_concentration.csv — pick one to load its true molecular descriptors.</p>
        {loadingPresets ? (
          <p className="panel-sub">Loading presets…</p>
        ) : (
          <div className="preset-grid">
            {presets.map((p) => (
              <button
                key={p.cas}
                type="button"
                className={"preset-chip " + (activePreset && activePreset.cas === p.cas ? "active" : "")}
                disabled={busy}
                onClick={() => selectPreset(p)}
              >
                {p.name}
                <span>CAS {p.cas}</span>
              </button>
            ))}
            <button
              type="button"
              className={"preset-chip other-chip " + (mode === "search" ? "active" : "")}
              disabled={busy}
              onClick={() => setMode(mode === "search" ? "preset" : "search")}
            >
              <Search size={13} /> Search another…
              <span>all 779 compounds</span>
            </button>
            <button
              type="button"
              className={"preset-chip other-chip " + (mode === "custom" && !activePreset ? "active" : "")}
              disabled={busy}
              onClick={selectOther}
            >
              Other / custom
              <span>enter your own values</span>
            </button>
          </div>
        )}

        {mode === "search" && (
          <>
            <div className="search-row">
              <input
                placeholder="Search by CAS number or SMILES fragment…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="search-results">
              {searchResults.slice(0, 15).map((r) => (
                <div key={r.cas} className="search-result-row" onClick={() => selectSearchResult(r)}>
                  <span>CAS {r.cas}</span>
                  <span className="badge-mini">Class {r.true_class}</span>
                </div>
              ))}
              {query.length >= 2 && searchResults.length === 0 && <p className="panel-sub">No matches.</p>}
            </div>
          </>
        )}
      </div>

      <div className="panel-card">
        <div className="panel-title">
          <Activity size={16} /> Molecular descriptors
        </div>
        <p className="panel-sub">These 9 Dragon descriptors are exactly what the deployed model was trained on.</p>

        <div className="name-field">
          <label>Label this test</label>
          <input
            value={compoundName}
            disabled={busy}
            onChange={(e) => {
              setCompoundName(e.target.value);
              if (!activePreset) setMode("custom");
            }}
            placeholder="e.g. My candidate compound"
          />
        </div>

        <div className="input-list">
          {FEATURE_ORDER.map((f) => (
            <InputRow key={f} fkey={f} value={inputs[f]} onChange={onManualChange} disabled={busy} />
          ))}
        </div>
      </div>
    </div>
  );
}
