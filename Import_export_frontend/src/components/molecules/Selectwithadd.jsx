import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import Select from "../atoms/Select";
import { colors, radius, typography } from "../../styles/tokens";

export default function SelectWithAdd({
  options = [],
  value,
  onChange,
  placeholder,
  error,
  addPlaceholder = "Nouvelle valeur…",
  onAdd,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState(null);

  function resetAddForm() {
    setDraft("");
    setAddError(null);
    setIsAdding(false);
  }

  async function handleConfirmAdd() {
    const trimmed = draft.trim();
    if (!trimmed || isSaving) return;

    const existing = options.find(
      (option) =>
        String(option.value).trim().toLowerCase() === trimmed.toLowerCase() ||
        String(option.label || "").trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      onChange(existing.value);
      resetAddForm();
      return;
    }

    if (!onAdd) {
      setAddError("L'ajout n'est pas disponible pour ce champ.");
      return;
    }

    try {
      setIsSaving(true);
      setAddError(null);
      const created = await onAdd(trimmed);

      if (!created || !created.value) {
        throw new Error("Réponse backend invalide.");
      }

      onChange(created.value);
      resetAddForm();
    } catch (err) {
      console.error("Erreur ajout référentiel :", err);

      const data = err?.response?.data;
      let message = "Impossible d'ajouter cette valeur.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.erreurs) && data.erreurs.length) {
        message = data.erreurs.map((item) => item.message).join(", ");
      } else if (err?.response?.status === 404) {
        message = "Route d'ajout introuvable. Redémarrez le backend avec cette version du projet.";
      } else if (err?.message) {
        message = err.message;
      }

      setAddError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Select
            options={options}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            error={error}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding((previous) => !previous);
            setAddError(null);
          }}
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
          }}
        >
          <Plus
            size={18}
            style={{ transform: isAdding ? "rotate(45deg)" : "none" }}
          />
        </button>
      </div>

      {isAdding && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
            }}
          >
            <input
              autoFocus
              value={draft}
              disabled={isSaving}
              onChange={(event) => {
                setDraft(event.target.value);
                setAddError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleConfirmAdd();
                }
                if (event.key === "Escape") {
                  resetAddForm();
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
                outline: "none",
              }}
            />

            <button
              type="button"
              disabled={!draft.trim() || isSaving}
              onClick={handleConfirmAdd}
              title="Ajouter"
              style={{
                width: 36,
                height: 36,
                border: "none",
                borderRadius: radius.sm,
                background: colors.primary,
                color: "#fff",
                cursor: !draft.trim() || isSaving ? "not-allowed" : "pointer",
                opacity: !draft.trim() || isSaving ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={16} />
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={resetAddForm}
              title="Annuler"
              style={{
                width: 36,
                height: 36,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.sm,
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {addError && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#C22D2D" }}>
              ⚠️ {addError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
