const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res;
}

export const api = {
  health: () => request("/health").then((r) => r.json()),

  getPresets: () => request("/compounds/presets").then((r) => r.json()),

  searchCompounds: (q) =>
    request(`/compounds/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),

  predict: (payload) =>
    request("/predict", { method: "POST", body: JSON.stringify(payload) }).then((r) => r.json()),

  getHistory: () => request("/history").then((r) => r.json()),

  clearHistory: () => request("/history", { method: "DELETE" }).then((r) => r.json()),

  deleteRecord: (id) => request(`/history/${id}`, { method: "DELETE" }).then((r) => r.json()),

  getStats: () => request("/stats").then((r) => r.json()),

  getModelInfo: () => request("/model-info").then((r) => r.json()),

  reportUrl: (id) => `${BASE}/report/${id}`,
  csvExportUrl: () => `${BASE}/report/history/csv`,
};
