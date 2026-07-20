import React, { useMemo } from "react";
import FishSVG from "./FishSVG.jsx";

function Bubbles({ count = 14, paused }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: 4 + Math.random() * 92,
        size: 4 + Math.random() * 10,
        duration: 5 + Math.random() * 6,
        delay: Math.random() * 6,
      })),
    [count]
  );
  return (
    <div className="bubble-layer">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      ))}
    </div>
  );
}

export default function TankScene({ phase, dosing }) {
  const tankClass =
    "tank" +
    (phase === "safe" ? " tank-safe" : "") +
    (phase === "dead" ? " tank-dead" : phase === "absorbing" || phase === "xray" ? " tank-warn" : "");
  const fishAnimClass =
    phase === "dead"
      ? "fish-sunk"
      : phase === "safe"
      ? "fish-swim fish-swim-fast"
      : phase === "absorbing"
      ? "fish-swim fish-shudder"
      : "fish-swim";

  return (
    <div className={tankClass}>
      <div className="light-rays">
        <span className="ray ray1" />
        <span className="ray ray2" />
        <span className="ray ray3" />
      </div>
      <Bubbles paused={phase === "dead"} />
      {(phase === "absorbing" || phase === "xray") && <div className="water-tint" />}
      {phase === "safe" && <div className="water-glow" />}

      {dosing && (
        <>
          <span className="droplet" />
          <span className="ripple" />
        </>
      )}

      <div className={fishAnimClass}>
        <FishSVG phase={phase} />
      </div>

      <div className="tank-floor">
        <svg viewBox="0 0 400 60" width="100%" height="60" preserveAspectRatio="none">
          <ellipse cx="40" cy="50" rx="34" ry="12" fill="#0a2233" />
          <ellipse cx="120" cy="54" rx="46" ry="14" fill="#0d2a3d" />
          <ellipse cx="330" cy="48" rx="40" ry="13" fill="#0a2233" />
          <path className="plant sway1" d="M70,58 C60,30 90,20 78,0" stroke="#1c8a5e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="plant sway2" d="M100,58 C112,26 84,16 96,-4" stroke="#22a86f" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="plant sway1" d="M300,58 C288,28 316,18 306,-2" stroke="#1c8a5e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className="plant sway2" d="M340,58 C352,30 324,18 336,-4" stroke="#22a86f" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
