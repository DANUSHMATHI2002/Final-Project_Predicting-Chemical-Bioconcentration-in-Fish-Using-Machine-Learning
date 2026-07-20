import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ChevronDown, ChevronUp, Download, FileDown, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { FEATURE_ORDER } from "../data/featureMeta.js";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s] = await Promise.all([api.getHistory(), api.getStats()]);
      setHistory(h);
      setStats(s);
    } catch (e) {
      setError(e.message || "Could not reach the backend on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearAll = async () => {
    if (!window.confirm("Clear all saved test history? This can't be undone.")) return;
    await api.clearHistory();
    load();
  };

  const deleteOne = async (id) => {
    await api.deleteRecord(id);
    load();
  };

  if (loading) return <div className="loading-state"><HistoryIcon size={24} /><p>Loading dashboard…</p></div>;
  if (error) return <div className="error-state"><p>{error}</p><button className="btn-ghost" onClick={load}>Retry</button></div>;

  const pieData = [
    { name: "Safe", value: stats.safe, color: "#34d399" },
    { name: "Dangerous", value: stats.dangerous, color: "#ff5d5d" },
  ];
  const freqData = stats.top_compounds.map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name, count: c.count }));
  const lineData = stats.confidence_trend.map((t, i) => ({ idx: i + 1, confidence: t.confidence }));

  const filtered = history.filter((h) => {
    if (filter !== "all" && h.prediction !== filter) return false;
    if (query && !h.compound_name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dash">
      <div className="dash-head">
        <div />
        <a className="btn-ghost" href={api.csvExportUrl()}>
          <FileDown size={15} /> Export full history (CSV)
        </a>
      </div>

      <div className="stat-row">
        <div className="stat-card"><span className="stat-label">Total tests</span><span className="stat-value">{stats.total}</span></div>
        <div className="stat-card stat-safe"><span className="stat-label">Safe</span><span className="stat-value">{stats.safe}</span></div>
        <div className="stat-card stat-danger"><span className="stat-label">Dangerous</span><span className="stat-value">{stats.dangerous}</span></div>
        <div className="stat-card"><span className="stat-label">Avg. confidence</span><span className="stat-value">{stats.avg_confidence.toFixed(1)}%</span></div>
      </div>

      {stats.total === 0 ? (
        <div className="empty-dash">
          <HistoryIcon size={26} />
          <p>No tests logged yet. Run a test in the tank to start building your dashboard.</p>
        </div>
      ) : (
        <>
          <div className="chart-row">
            <div className="chart-card">
              <div className="chart-title">Safe vs. dangerous</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b2a43", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eaf6fa" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Most-tested compounds</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={freqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: "#9fc1d0", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#9fc1d0", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0b2a43", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eaf6fa" }} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">Confidence trend (last 30)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="idx" tick={{ fill: "#9fc1d0", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9fc1d0", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0b2a43", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eaf6fa" }} formatter={(v) => `${v}%`} />
                  <Line type="monotone" dataKey="confidence" stroke="#5eead4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="history-card">
            <div className="history-head">
              <div className="search-box">
                <Search size={14} />
                <input placeholder="Search by compound…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="filter-tabs">
                {["all", "safe", "dangerous"].map((f) => (
                  <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn-ghost btn-danger-outline" onClick={clearAll}>
                <Trash2 size={14} /> Clear history
              </button>
            </div>

            <div className="history-table">
              <div className="history-row history-row-head">
                <span>Date</span><span>Compound</span><span>Result</span><span>Confidence</span><span>PDF</span><span />
              </div>
              {filtered.map((h) => {
                const conf = ((h.prediction === "dangerous" ? h.probability : 1 - h.probability) * 100).toFixed(1);
                const isOpen = !!expanded[h.id];
                return (
                  <div key={h.id} className="history-row-wrap">
                    <div className="history-row">
                      <span onClick={() => setExpanded((e) => ({ ...e, [h.id]: !e[h.id] }))} style={{ cursor: "pointer" }}>
                        {new Date(h.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span onClick={() => setExpanded((e) => ({ ...e, [h.id]: !e[h.id] }))} style={{ cursor: "pointer" }}>{h.compound_name}</span>
                      <span className={"badge " + (h.prediction === "dangerous" ? "badge-danger" : "badge-safe")}>{h.prediction === "dangerous" ? "Toxic" : "Safe"}</span>
                      <span>{conf}%</span>
                      <a className="row-report-btn" href={api.reportUrl(h.id)} target="_blank" rel="noreferrer" title="Download PDF report">
                        <Download size={14} />
                      </a>
                      <span onClick={() => setExpanded((e) => ({ ...e, [h.id]: !e[h.id] }))} style={{ cursor: "pointer" }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="history-detail">
                        Strongest factor: <strong>{h.top_factors && h.top_factors[0] ? h.top_factors[0].feature : "—"}</strong> · Source:{" "}
                        {h.source === "dataset" ? "training-set compound" : "custom manual profile"}
                        {h.true_class != null && <> · Dataset label: Class {h.true_class}</>}
                        <div className="history-values">
                          {FEATURE_ORDER.map((f) => (
                            <span key={f}>{f}: {h.inputs ? h.inputs[f] : "—"}</span>
                          ))}
                        </div>
                        <button className="btn-ghost btn-danger-outline" style={{ marginTop: 8 }} onClick={() => deleteOne(h.id)}>
                          <Trash2 size={12} /> Delete this record
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="history-empty">No matching tests.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
