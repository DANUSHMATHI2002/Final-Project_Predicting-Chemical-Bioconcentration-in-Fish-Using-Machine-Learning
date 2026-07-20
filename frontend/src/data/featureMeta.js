export const FEATURE_ORDER = ["nHM", "piPC09", "PCD", "X2Av", "MLOGP", "ON1V", "N-072", "B02[C-N]", "F04[C-O]"];

export const FEATURE_META = {
  "nHM": { label: "Heavy Atoms", desc: "Count of heavy (non-hydrogen) atoms in the molecule, including halogens and metals.", min: 0, max: 12, step: 1 },
  "piPC09": { label: "Molecular Path Count", desc: "Topological index counting weighted paths of order 9 through the molecular graph — a proxy for structural complexity.", min: 0, max: 9.5, step: 0.01 },
  "PCD": { label: "Path / Cluster Ratio", desc: "Ratio of multiple-path count to simple path count — reflects how branched vs. linear the structure is.", min: 0, max: 6, step: 0.01 },
  "X2Av": { label: "Valence Connectivity", desc: "Average valence connectivity index (χ2) — describes the electronic environment around bonds.", min: 0.05, max: 2.3, step: 0.01 },
  "MLOGP": { label: "Fat–Water Partition", desc: "Moriguchi octanol–water partition coefficient. Higher = stronger affinity for fatty tissue over water — a classic bioaccumulation driver.", min: -2, max: 8.5, step: 0.01 },
  "ON1V": { label: "Overall Valence Index", desc: "Randic-type connectivity index weighted by valence. Consistently one of the most influential descriptors across the trained models.", min: 0.05, max: 7.2, step: 0.01 },
  "N-072": { label: "N-Fragment Count", desc: "Frequency of a specific nitrogen-containing structural fragment (Dragon atom-centered fragment code).", min: 0, max: 3, step: 1 },
  "B02[C-N]": { label: "C–N Pair (dist. 2)", desc: "Whether a carbon and nitrogen sit exactly 2 bonds apart anywhere in the molecule.", min: 0, max: 1, step: 1, binary: true },
  "F04[C-O]": { label: "C–O Pairs (dist. 4)", desc: "How many carbon–oxygen atom pairs sit exactly 4 bonds apart in the molecule.", min: 0, max: 26, step: 1 },
};

export const ORGAN_LABEL = { gills: "Gills", liver: "Liver", kidneys: "Kidneys", heart: "Heart" };

export function affectedOrgans(inputs, prediction) {
  if (prediction !== "dangerous") return [];
  const organs = ["gills", "liver"];
  if (Number(inputs["MLOGP"]) > 3.5) organs.push("kidneys");
  if (Number(inputs["nHM"]) >= 4) organs.push("heart");
  return organs;
}

export function classToLabel(c) {
  return c === 3 ? "safe" : "dangerous";
}

export function defaultInputs() {
  // Sensible neutral starting point (roughly dataset medians); the true
  // scaling/model logic lives entirely on the backend.
  return { "nHM": 1, "piPC09": 3.5, "PCD": 1.4, "X2Av": 0.2, "MLOGP": 3.1, "ON1V": 1.3, "N-072": 0, "B02[C-N]": 0, "F04[C-O]": 2 };
}
