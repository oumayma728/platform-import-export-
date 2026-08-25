import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getModerationHistory } from "../api/adminModeration";
import { getAdminCompanies } from "../api/adminCompanies";
import { getAdminUsers } from "../api/adminUsers";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";


const ACTION_META = {
  VALIDATION: {
    label: "Validation",
    icon: "✅",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
  },
  REJECTION: {
    label: "Rejet",
    icon: "❌",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#fecaca",
  },
  SUSPENSION: {
    label: "Suspension",
    icon: "⚠️",
    color: "#c2410c",
    bg: "#ffedd5",
    border: "#fed7aa",
  },
  KYB_VERIFICATION: {
    label: "Vérification KYB",
    icon: "📋",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a",
  },
  BADGE_ASSIGNED: {
    label: "Attribution Badge",
    icon: "🏆",
    color: "#6d28d9",
    bg: "#ede9fe",
    border: "#ddd6fe",
  },
};


function ActionDetails({ actionType, details }) {
  if (!details || (typeof details === "object" && Object.keys(details).length === 0)) {
    return <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Aucun détail</span>;
  }

  let d = details;
  if (typeof details === "string") {
    try { d = JSON.parse(details); } catch { d = {}; }
  }

  if (actionType === "VALIDATION" || actionType === "REJECTION") {
    return (
      <div>
        <span style={{ fontWeight: 600, color: "#374151" }}>Motif : </span>
        <span style={{ color: "#4b5563" }}>{d.motif || "Non précisé"}</span>
      </div>
    );
  }

  if (actionType === "SUSPENSION") {
    return (
      <div>
        <span style={{ fontWeight: 600, color: "#374151" }}>Raison : </span>
        <span style={{ color: "#4b5563" }}>{d.reason || d.motif || "Compte suspendu"}</span>
      </div>
    );
  }

  if (actionType === "KYB_VERIFICATION") {
    return (
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <span>
          <strong>Statut :</strong>{" "}
          <span style={{
            display: "inline-block",
            padding: "2px 7px",
            borderRadius: "4px",
            background: d.status === "VALIDE" ? "#dcfce7" : "#fef3c7",
            color: d.status === "VALIDE" ? "#15803d" : "#92400e",
            fontSize: "11px",
            fontWeight: 700,
          }}>
            {d.status || "—"}
          </span>
        </span>
        {d.kybScore !== undefined && (
          <span>
            <strong>Score :</strong>{" "}
            <span style={{ fontWeight: 700, color: "#B8720A" }}>
              {Number(d.kybScore).toFixed(0)}%
            </span>
          </span>
        )}
      </div>
    );
  }

  if (actionType === "BADGE_ASSIGNED") {
    return (
      <div>
        <span style={{ fontWeight: 600, color: "#374151" }}>Badge : </span>
        <span style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "9999px",
          background: "#ede9fe",
          color: "#6d28d9",
          fontWeight: 700,
          fontSize: "11px",
        }}>
          {d.badgeType || "—"}
        </span>
      </div>
    );
  }

  return <span style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>{JSON.stringify(d)}</span>;
}


const COLUMNS = [
  {
    key: "timestamp",
    label: "Date & Heure",
    sortable: true,
    render: (val) =>
      val ? (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontWeight: 600, color: "#14161C", fontSize: "13px" }}>
            {new Date(val).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
            {new Date(val).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </div>
      ) : "—",
  },
  {
    key: "actionType",
    label: "Action",
    sortable: false,
    render: (val) => {
      const meta = ACTION_META[val] || {
        label: val || "Inconnu",
        icon: "⚙️",
        color: "#374151",
        bg: "#f3f4f6",
        border: "#e5e7eb",
      };
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "9999px",
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          color: meta.color,
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: "nowrap",
        }}>
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </span>
      );
    },
  },
  {
    key: "adminId",
    label: "Administrateur",
    sortable: false,
    render: (val) => (
      <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>
        {val ? `${val.slice(0, 8)}…${val.slice(-4)}` : "Système"}
      </div>
    ),
  },
  {
    key: "details",
    label: "Détails & Motifs",
    sortable: false,
    render: (val, row) => <ActionDetails actionType={row.actionType} details={val} />,
  },
];


function EntitySearchSelector({
  entityType,
  entities,
  selectedEntityId,
  onSelectEntity,
  loading,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

 
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId),
    [entities, selectedEntityId]
  );


  const filteredEntities = useMemo(() => {
    if (!searchTerm.trim()) return entities;
    const q = searchTerm.toLowerCase();
    return entities.filter((e) => {
      const name = (e.name || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      const country = (e.country || "").toLowerCase();
      const sector = (e.sector || "").toLowerCase();
      const id = (e.id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || country.includes(q) || sector.includes(q) || id.includes(q);
    });
  }, [entities, searchTerm]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#9ca3af",
          fontFamily: "'Inter', sans-serif",
          marginBottom: "8px",
        }}
      >
        Rechercher {entityType === "COMPANY" ? "une entreprise" : "un utilisateur"}
      </label>

      {/* Barre de sélection / recherche */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          minHeight: "42px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: `1.5px solid ${isOpen ? "#B8720A" : "#e5e7eb"}`,
          background: "#fafaf9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: "8px",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(184, 114, 10, 0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, overflow: "hidden" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {isOpen ? (
            <input
              type="text"
              autoFocus
              placeholder={
                entityType === "COMPANY"
                  ? "Tapez un nom, pays, secteur..."
                  : "Tapez un email, nom..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "13px",
                fontFamily: "'Inter', sans-serif",
                color: "#14161C",
                outline: "none",
              }}
            />
          ) : (
            <span style={{ fontSize: "13px", fontFamily: "'Inter', sans-serif", color: selectedEntity ? "#14161C" : "#9ca3af", fontWeight: selectedEntity ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selectedEntity ? (
                entityType === "COMPANY"
                  ? `${selectedEntity.name || "Sans nom"} (${selectedEntity.country || "—"})`
                  : `${selectedEntity.email || selectedEntity.name || selectedEntity.id} (${selectedEntity.role || "USER"})`
              ) : (
                loading ? "Chargement des entités..." : "Cliquez pour rechercher..."
              )}
            </span>
          )}
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Menu déroulant de résultats autocomplétés */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 100,
            padding: "6px",
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
              Chargement des entités…
            </div>
          ) : filteredEntities.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
              Aucun résultat pour "{searchTerm}"
            </div>
          ) : (
            filteredEntities.map((e) => {
              const isSelected = e.id === selectedEntityId;
              return (
                <div
                  key={e.id}
                  onClick={() => {
                    onSelectEntity(e.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "7px",
                    background: isSelected ? "#f6f5f2" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(evt) => (evt.currentTarget.style.background = isSelected ? "#f6f5f2" : "#fafaf9")}
                  onMouseLeave={(evt) => (evt.currentTarget.style.background = isSelected ? "#f6f5f2" : "transparent")}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: isSelected ? 700 : 500, color: "#14161C", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {entityType === "COMPANY" ? (e.name || "Entreprise sans nom") : (e.email || e.name || "Utilisateur")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "'Inter', sans-serif", display: "flex", gap: "8px" }}>
                      {entityType === "COMPANY" ? (
                        <>
                          <span>📍 {e.country || "Pays inconnu"}</span>
                          {e.sector && <span>• 🏷️ {e.sector}</span>}
                        </>
                      ) : (
                        <>
                          <span>👤 {e.role || "USER"}</span>
                          {e.name && <span>• {e.name}</span>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
                      background: e.status === "VALIDE" ? "#dcfce7" : e.status === "SUSPENDU" ? "#ffedd5" : "#fef3c7",
                      color: e.status === "VALIDE" ? "#15803d" : e.status === "SUSPENDU" ? "#c2410c" : "#92400e",
                      flexShrink: 0,
                    }}
                  >
                    {e.status || "—"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


export default function ModerationHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [entityType, setEntityType] = useState(
    searchParams.get("entity_type") || "COMPANY"
  );
  const [entityList, setEntityList] = useState([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(
    searchParams.get("entity_id") || ""
  );

  // Filtres locaux
  const [actionFilter, setActionFilter] = useState("TOUS");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Historique
  const [historyData, setHistoryData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  
  const fetchRef = useRef(0);

  
  useEffect(() => {
    let cancelled = false;
    setEntitiesLoading(true);
    setEntityList([]);

    const load = entityType === "COMPANY"
      ? getAdminCompanies({ limit: 100 })
      : getAdminUsers({ limit: 100 });

    load
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        setEntityList(list);
        setSelectedEntityId((prev) => {
          const found = list.find((e) => e.id === prev);
          return found ? prev : (list[0]?.id || "");
        });
      })
      .catch((err) => {
        if (!cancelled) console.error("[HISTORY] Erreur entités :", err);
      })
      .finally(() => {
        if (!cancelled) setEntitiesLoading(false);
      });

    return () => { cancelled = true; };
  }, [entityType]);


  useEffect(() => {
    if (!selectedEntityId) {
      setHistoryData([]);
      setTotal(0);
      return;
    }

    const callId = ++fetchRef.current;
    setHistoryLoading(true);
    setHistoryError("");

    getModerationHistory(entityType, selectedEntityId, currentPage, LIMIT)
      .then((res) => {
        if (callId !== fetchRef.current) return;
        setHistoryData(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => {
        if (callId !== fetchRef.current) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Impossible de charger l'historique.";
        setHistoryError(Array.isArray(msg) ? msg.join(", ") : String(msg));
        setHistoryData([]);
        setTotal(0);
      })
      .finally(() => {
        if (callId === fetchRef.current) setHistoryLoading(false);
      });
  }, [entityType, selectedEntityId, currentPage]);

 
  function handleTypeChange(type) {
    setEntityType(type);
    setCurrentPage(1);
    setHistoryData([]);
    setTotal(0);
    setActionFilter("TOUS");
    setSearchKeyword("");
    setSearchParams({ entity_type: type });
  }

  function handleEntitySelect(id) {
    setSelectedEntityId(id);
    setCurrentPage(1);
    setSearchParams({ entity_type: entityType, entity_id: id });
  }

  function handlePageChange(p) {
    setCurrentPage(p);
  }

 
  const filteredHistory = historyData.filter((item) => {
    if (actionFilter !== "TOUS" && item.actionType !== actionFilter) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const detailsStr = JSON.stringify(item.details || {}).toLowerCase();
      const adminStr = (item.adminId || "").toLowerCase();
      return detailsStr.includes(q) || adminStr.includes(q);
    }
    return true;
  });

  const selectedEntity = entityList.find((e) => e.id === selectedEntityId);

  
  return (
    <div style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{
          fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#B8720A",
          fontFamily: "'Inter', sans-serif", margin: "0 0 6px",
        }}>
          Traçabilité & Audit
        </p>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "24px", fontWeight: 700,
          color: "#14161C", margin: "0 0 8px", letterSpacing: "-0.02em",
        }}>
          Historique des actions de modération
        </h1>
        <p style={{
          fontSize: "13px", color: "#6b7280",
          fontFamily: "'Inter', sans-serif", margin: 0,
        }}>
          Journal complet des décisions de validation, rejets, suspensions, vérifications KYB et attributions de badges.
        </p>
      </div>

      {/* ── Sélecteur d'entité interactif avec recherche ── */}
      <div style={{
        background: "#fff", borderRadius: "12px", border: "1px solid #ebebea",
        padding: "20px 24px", marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>

          {/* Onglets COMPANY / USER */}
          <div>
            <label style={{
              display: "block", fontSize: "11px", fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: "#9ca3af", fontFamily: "'Inter', sans-serif", marginBottom: "8px",
            }}>
              Type d'entité
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {["COMPANY", "USER"].map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  style={{
                    height: "42px", padding: "0 16px", borderRadius: "8px",
                    border: `1.5px solid ${entityType === type ? "#14161C" : "#e5e7eb"}`,
                    background: entityType === type ? "#14161C" : "#fafaf9",
                    color: entityType === type ? "#fff" : "#374151",
                    fontSize: "13px", fontFamily: "'Inter', sans-serif",
                    fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {type === "COMPANY" ? "🏢 Entreprises" : "👤 Utilisateurs"}
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteur dynamique avec autocomplétion */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <EntitySearchSelector
              entityType={entityType}
              entities={entityList}
              selectedEntityId={selectedEntityId}
              onSelectEntity={handleEntitySelect}
              loading={entitiesLoading}
            />
          </div>
        </div>

        {/* Détail entité sélectionnée */}
        {selectedEntity && (
          <div style={{
            marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f0f0ee",
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
            fontSize: "12px", color: "#6b7280", fontFamily: "'Inter', sans-serif",
          }}>
            <span>
              <strong>ID :</strong>{" "}
              <code style={{ color: "#374151", background: "#f3f4f6", padding: "1px 5px", borderRadius: "4px" }}>
                {selectedEntity.id}
              </code>
            </span>
            <span>•</span>
            <span>
              <strong>Statut actuel :</strong>{" "}
              <span style={{ fontWeight: 600, color: "#14161C" }}>
                {selectedEntity.status || "—"}
              </span>
            </span>
            {entityType === "COMPANY" && selectedEntity.country && (
              <>
                <span>•</span>
                <span><strong>Pays :</strong> {selectedEntity.country}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Filtres & Recherche d'actions ── */}
      <div style={{
        background: "#fff", borderRadius: "12px", border: "1px solid #ebebea",
        padding: "14px 20px", marginBottom: "20px",
        display: "flex", flexWrap: "wrap", gap: "14px",
        alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Filtre type d'action */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", fontFamily: "'Inter', sans-serif" }}>
            Filtrer par action :
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              height: "34px", padding: "0 12px", borderRadius: "7px",
              border: "1px solid #e5e7eb", background: "#fafaf9",
              fontSize: "12px", fontFamily: "'Inter', sans-serif",
              color: "#14161C", cursor: "pointer", outline: "none",
            }}
          >
            <option value="TOUS">Toutes les actions</option>
            <option value="VALIDATION">✅ Validation</option>
            <option value="REJECTION">❌ Rejet</option>
            <option value="SUSPENSION">⚠️ Suspension</option>
            <option value="KYB_VERIFICATION">📋 Vérification KYB</option>
            <option value="BADGE_ASSIGNED">🏆 Attribution Badge</option>
          </select>
        </div>

        {/* Recherche texte dans les détails */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Rechercher dans les motifs..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: "100%", height: "34px",
              padding: "0 12px 0 34px", borderRadius: "7px",
              border: "1px solid #e5e7eb", background: "#fafaf9",
              fontSize: "12px", fontFamily: "'Inter', sans-serif",
              color: "#14161C", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ position: "absolute", left: "11px", top: "11px" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Compteur de résultats */}
        <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
          {filteredHistory.length} action{filteredHistory.length !== 1 ? "s" : ""} affichée{filteredHistory.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Erreur ── */}
      {historyError && (
        <div style={{
          padding: "12px 16px", background: "#fee2e2",
          border: "1px solid #fecaca", borderRadius: "8px",
          color: "#991b1b", fontSize: "13px",
          fontFamily: "'Inter', sans-serif", marginBottom: "20px",
          display: "flex", gap: "8px", alignItems: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {historyError}
        </div>
      )}

      {/* ── Tableau ── */}
      <DataTable
        columns={COLUMNS}
        data={filteredHistory}
        isLoading={historyLoading}
        emptyText={
          !selectedEntityId
            ? "Sélectionnez une entité pour afficher son historique."
            : "Aucune action de modération enregistrée pour cette entité."
        }
      />

      {/* ── Pagination ── */}
      <div style={{ marginTop: "16px" }}>
        <Pagination
          page={currentPage}
          total={total}
          limit={LIMIT}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
