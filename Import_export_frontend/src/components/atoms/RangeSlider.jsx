import { useRef, useState, useCallback, useEffect } from "react";
import { colors, radius, typography } from "../../styles/tokens";

/**
 * Curseur de prix à deux poignées.
 *
 * Contrairement à la version précédente (deux <input type="range">
 * superposés), chaque poignée est ici un élément indépendant qu'on déplace
 * nous-mêmes via les Pointer Events. Ça évite le principal défaut de la
 * technique des inputs empilés : quand les deux poignées sont proches ou se
 * touchent, l'une "vole" les clics destinés à l'autre et on n'arrive plus à
 * la déplacer. Ici, chaque poignée a sa propre zone cliquable précise.
 */
export default function RangeSlider({ min, max, valueMin, valueMax, onChange, unit = "€" }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null); // "min" | "max" | null

  const range = max - min || 1;
  // Écart minimal entre les deux poignées (en valeur), pour qu'elles restent
  // toujours individuellement saisissables même complètement rapprochées.
  const minGap = Math.max(1, Math.round(range * 0.01));

  function clamp(value) {
    return Math.min(Math.max(value, min), max);
  }

  function valueFromClientX(clientX) {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio = rect.width ? (clientX - rect.left) / rect.width : 0;
    return clamp(Math.round(min + ratio * range));
  }

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      const value = valueFromClientX(e.clientX);

      if (dragging === "min") {
        const next = Math.min(value, valueMax - minGap);
        onChange({ min: clamp(next), max: valueMax });
      } else {
        const next = Math.max(value, valueMin + minGap);
        onChange({ min: valueMin, max: clamp(next) });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, valueMin, valueMax, min, max, minGap]
  );

  useEffect(() => {
    if (!dragging) return undefined;

    function handlePointerUp() {
      setDragging(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, handlePointerMove]);

  // Support clavier (accessibilité) : flèches gauche/droite sur une
  // poignée avec le focus la déplacent d'un pas.
  function handleKeyDown(e, which) {
    const step = Math.max(1, Math.round(range / 100));
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    if (!delta) return;
    e.preventDefault();

    if (which === "min") {
      onChange({ min: clamp(Math.min(valueMin + delta, valueMax - minGap)), max: valueMax });
    } else {
      onChange({ min: valueMin, max: clamp(Math.max(valueMax + delta, valueMin + minGap)) });
    }
  }

  const leftPercent = ((valueMin - min) / range) * 100;
  const rightPercent = ((valueMax - min) / range) * 100;

  return (
    <div style={{ width: 220 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: typography.fontSizeSm,
          color: colors.textMuted,
          marginBottom: 6,
        }}
      >
        <span>
          {Math.round(valueMin).toLocaleString("fr-FR")} {unit}
        </span>
        <span>
          {Math.round(valueMax).toLocaleString("fr-FR")} {unit}
        </span>
      </div>

      {/* touchAction: "none" empêche le navigateur mobile d'interpréter le
          drag d'une poignée comme un scroll de la page. */}
      <div ref={trackRef} style={{ position: "relative", height: 32, touchAction: "none" }}>
        {/* Piste de fond */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: radius.full,
            backgroundColor: colors.border,
          }}
        />
        {/* Portion sélectionnée */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: `${leftPercent}%`,
            width: `${Math.max(rightPercent - leftPercent, 0)}%`,
            height: 4,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
          }}
        />

        <Handle
          label="Prix minimum"
          percent={leftPercent}
          min={min}
          max={max}
          value={valueMin}
          isActive={dragging === "min"}
          onPointerDown={() => setDragging("min")}
          onKeyDown={(e) => handleKeyDown(e, "min")}
        />
        <Handle
          label="Prix maximum"
          percent={rightPercent}
          min={min}
          max={max}
          value={valueMax}
          isActive={dragging === "max"}
          onPointerDown={() => setDragging("max")}
          onKeyDown={(e) => handleKeyDown(e, "max")}
        />
      </div>
    </div>
  );
}

function Handle({ label, percent, min, max, value, isActive, onPointerDown, onKeyDown }) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onPointerDown();
      }}
      onKeyDown={onKeyDown}
      style={{
        position: "absolute",
        top: 6,
        left: `${percent}%`,
        width: 20,
        height: 20,
        marginLeft: -10,
        borderRadius: "50%",
        background: colors.primary,
        border: "2px solid #fff",
        boxShadow: isActive
          ? "0 2px 8px rgba(184,114,10,0.45)"
          : "0 1px 3px rgba(0,0,0,0.25)",
        cursor: isActive ? "grabbing" : "grab",
        touchAction: "none",
        zIndex: isActive ? 3 : 2,
        outline: "none",
      }}
    />
  );
}
