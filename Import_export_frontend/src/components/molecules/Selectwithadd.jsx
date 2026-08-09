import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import Select from "../atoms/Select";
import { colors, radius, typography } from "../../styles/tokens";
export default function SelectWithAdd({
  options,
  value,
  onChange,
  placeholder,
  error,
  addPlaceholder = "Nouvelle valeur…",
}) {
  const [customOptions, setCustomOptions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const mergedOptions = [...options, ...customOptions];

  function handleConfirmAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const alreadyExists = mergedOptions.some(
      (opt) => opt.value.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadyExists) {
      setCustomOptions((prev) => [...prev, { value: trimmed, label: trimmed }]);
    }

    onChange(trimmed);
    setDraft("");
    setIsAdding(false);
  }

  function handleCancelAdd() {
    setDraft("");
    setIsAdding(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Select
            options={mergedOptions}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            error={error}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          title="Ajouter une valeur absente de la liste"
          aria-label="Ajouter une valeur absente de la liste"
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            border: `1px solid ${isAdding ? colors.primary : colors.border}`,
            borderRadius: radius.sm,
            background: isAdding ? colors.primary : "#fff",
            color: isAdding ? "#fff" : colors.textMuted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
          }}
        >
          <Plus size={18} style={{ transform: isAdding ? "rotate(45deg)" : "none", transition: "transform 0.15s ease" }} />
        </button>
      </div>

      {isAdding && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: -4,
            marginBottom: 12,
            padding: 10,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
          }}
        >
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirmAdd();
              } else if (e.key === "Escape") {
                handleCancelAdd();
              }
            }}
            placeholder={addPlaceholder}
            style={{
              flex: 1,
              height: 36,
              padding: "0 10px",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
              fontFamily: typography.body,
              fontSize: typography.fontSizeBase,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={!draft.trim()}
            title="Confirmer l'ajout"
            aria-label="Confirmer l'ajout"
            style={{
              width: 36,
              height: 36,
              border: "none",
              borderRadius: radius.sm,
              background: colors.primary,
              color: "#fff",
              cursor: draft.trim() ? "pointer" : "not-allowed",
              opacity: draft.trim() ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={handleCancelAdd}
            title="Annuler"
            aria-label="Annuler"
            style={{
              width: 36,
              height: 36,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
              background: "#fff",
              color: colors.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}