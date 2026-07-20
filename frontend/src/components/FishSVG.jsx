import React from "react";

export default function FishSVG({ phase }) {
  const isXray = phase === "absorbing" || phase === "xray" || phase === "dead";
  const isDead = phase === "dead";
  const bodyOpacity = phase === "xray" || phase === "dead" ? 0.18 : phase === "absorbing" ? 0.55 : 1;
  const skeletonOpacity = phase === "xray" || phase === "dead" ? 1 : phase === "absorbing" ? 0.35 : 0;

  return (
    <svg viewBox="0 0 300 150" width="100%" height="100%" style={{ overflow: "visible" }}>
      <g style={{ transition: "opacity 700ms ease" }} opacity={bodyOpacity}>
        <ellipse cx="150" cy="72" rx="78" ry="34" fill="url(#bodyGrad)" stroke="#0b3b4a" strokeWidth="2" />
        <g className={isDead ? "" : "fin-wag"} style={{ transformOrigin: "230px 72px" }}>
          <path d="M228,50 L272,20 L246,72 L272,124 L228,94 Z" fill="url(#tailGrad)" stroke="#0b3b4a" strokeWidth="2" />
        </g>
        <path d="M120,42 Q150,10 185,40 Q160,48 120,42Z" fill="url(#finGrad)" stroke="#0b3b4a" strokeWidth="1.5" opacity="0.9" />
        <path d="M115,100 Q95,128 130,124 Q125,108 115,100Z" fill="url(#finGrad)" stroke="#0b3b4a" strokeWidth="1.5" opacity="0.85" />
        <path d="M175,102 Q190,122 155,122 Q162,108 175,102Z" fill="url(#finGrad)" stroke="#0b3b4a" strokeWidth="1.5" opacity="0.85" />
        <circle cx="95" cy="62" r="10" fill="#fff" stroke="#0b3b4a" strokeWidth="1.5" />
        {isDead ? (
          <g stroke="#0b3b4a" strokeWidth="2" strokeLinecap="round">
            <line x1="90" y1="57" x2="100" y2="67" />
            <line x1="100" y1="57" x2="90" y2="67" />
          </g>
        ) : (
          <circle cx="96" cy="62" r="4.2" fill="#0b3b4a" />
        )}
        {!isDead && <rect className="eyelid" x="85" y="52" width="20" height="20" fill="#4fb6c9" opacity="0" />}
        <path d="M118,50 Q112,62 118,76" stroke="#0b3b4a" strokeWidth="2" fill="none" opacity="0.55" />
      </g>

      {isXray && (
        <g style={{ transition: "opacity 900ms ease" }} opacity={skeletonOpacity}>
          <path d="M95,72 Q150,58 250,72" stroke="#eafcff" strokeWidth="2.4" fill="none" opacity="0.9" />
          {[110, 130, 150, 170, 190, 210].map((x, idx) => (
            <path key={idx} d={`M${x},70 Q${x - 6},50 ${x - 14},44 M${x},74 Q${x - 6},96 ${x - 14},104`} stroke="#eafcff" strokeWidth="1.4" fill="none" opacity="0.75" />
          ))}
          <ellipse cx="98" cy="63" rx="14" ry="12" fill="none" stroke="#eafcff" strokeWidth="1.6" opacity="0.85" />
          {[[232, 45], [232, 72], [232, 99]].map(([x, y], i) => (
            <line key={i} x1="222" y1="72" x2={x} y2={y} stroke="#eafcff" strokeWidth="1.2" opacity="0.7" />
          ))}
          <g className="organ-pulse">
            <path d="M140,58 q14,-10 26,-2 q6,10 -6,16 q-16,4 -20,-14 Z" fill="#ff5d5d" opacity="0.85" />
          </g>
          <g className="organ-pulse" style={{ animationDelay: "0.3s" }}>
            <path d="M118,58 q-8,4 -6,14 q10,6 14,-4 q2,-8 -8,-10 Z" fill="#ff8b3d" opacity="0.85" />
          </g>
          <g className="organ-pulse" style={{ animationDelay: "0.6s" }}>
            <ellipse cx="168" cy="80" rx="9" ry="6" fill="#ff5d5d" opacity="0.75" />
            <ellipse cx="182" cy="82" rx="8" ry="5.5" fill="#ff5d5d" opacity="0.75" />
          </g>
        </g>
      )}

      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6fe3d6" />
          <stop offset="55%" stopColor="#22b8c9" />
          <stop offset="100%" stopColor="#0f7f96" />
        </linearGradient>
        <linearGradient id="tailGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22b8c9" />
          <stop offset="100%" stopColor="#0a5c6e" />
        </linearGradient>
        <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ff0e0" />
          <stop offset="100%" stopColor="#22b8c9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
