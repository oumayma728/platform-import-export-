// Illustration signature : un globe stylisé en pointillés avec des routes
// commerciales animées reliant des "ports" — symbolise le matching entre
// exportateurs et importateurs à travers le monde. 100% original, pas de photo.
export default function TradeRouteIllustration() {
  return (
    <svg
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#E3A548" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E3A548" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="300" cy="200" r="230" fill="url(#globeGlow)" />

      {/* Grille de points façon carte du monde stylisée */}
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 18 }).map((_, col) => {
          const x = 40 + col * 30;
          const y = 30 + row * 30;
          const dx = x - 300;
          const dy = y - 200;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 210) return null;
          // motif pseudo-aléatoire mais déterministe pour simuler des masses continentales
          const seed = (row * 18 + col) % 7;
          if (seed === 0 || seed === 3) return null;
          return (
            <circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r={1.6}
              fill="#E3A548"
              opacity={0.55}
            />
          );
        })
      )}

      {/* Routes commerciales animées entre "ports" */}
      {[
        { d: "M 120 260 Q 300 100 480 180", delay: "0s" },
        { d: "M 160 140 Q 300 260 460 120", delay: "0.6s" },
        { d: "M 100 190 Q 300 320 500 240", delay: "1.2s" },
      ].map((route, i) => (
        <path
          key={i}
          d={route.d}
          fill="none"
          stroke="#E3A548"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.7"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-24"
            dur="1.8s"
            begin={route.delay}
            repeatCount="indefinite"
          />
        </path>
      ))}

      {/* Ports / points de correspondance */}
      {[
        [120, 260],
        [480, 180],
        [160, 140],
        [460, 120],
        [100, 190],
        [500, 240],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#0E1526">
          <animate
            attributeName="r"
            values="5;7;5"
            dur="2.4s"
            begin={`${i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
