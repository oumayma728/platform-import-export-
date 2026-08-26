import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getUsers, getUserDetail, suspendUser, reactivateUser } from "../api/admin";
import Input from "../../../components/atoms/Input";
import Select from "../../../components/atoms/Select";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import Pagination from "../../../components/molecules/Pagination";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUS_MAP = {
  pending: { label: "En attente", tone: "primary" },
  validated: { label: "Validé", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },
  suspended: { label: "Suspendu", tone: "danger" },
};

const STATUS_FILTERS = [
  { value: "pending", label: "En attente" },
  { value: "validated", label: "Validé" },
  { value: "rejected", label: "Rejeté" },
  { value: "suspended", label: "Suspendu" },
];

export default function AdminUsersPage() {
  const { admin } = useAdmin();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendMotif, setSuspendMotif] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendError, setSuspendError] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchUsers = (p = page, s = search, st = statusFilter) => {
    setIsLoading(true);
    const params = { page: p, limit: 20 };
    if (s) params.search = s;
    if (st) params.status = st;
    getUsers(params)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(1, "", ""); }, []);

  if (!admin) return <Navigate to="/admin/login" replace />;

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search, statusFilter);
  }

  async function handleSuspend(userId, motif, durationDays) {
    setPendingAction(userId);
    try {
      await suspendUser(userId, motif || "Suspendu par l'administrateur", durationDays);
      setSuspendTarget(null);
      setSuspendMotif("");
      setSuspendDays(7);
      fetchUsers();
    } catch (err) { setError(err.message); }
    finally { setPendingAction(null); }
  }

  async function handleReactivate(userId) {
    setPendingAction(userId);
    try {
      await reactivateUser(userId);
      fetchUsers();
    } catch (err) { setError(err.message); }
    finally { setPendingAction(null); }
  }

  async function openHistory(user) {
    setHistoryTarget(user);
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const detail = await getUserDetail(user.id);
      setHistoryData(detail);
    } catch (err) { setHistoryError(err.message); }
    finally { setHistoryLoading(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
          Utilisateurs
        </h1>
        <p style={{ marginTop: 8, color: colors.textMuted }}>
          Recherchez, validez ou suspendez les comptes de la plateforme.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select
            value={statusFilter}
            options={STATUS_FILTERS}
            placeholder="Tous les statuts"
            onChange={(value) => { setStatusFilter(value); setPage(1); fetchUsers(1, search, value); }}
          />
        </div>
        <Button type="submit">Rechercher</Button>
      </form>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} utilisateur(s) trouvé(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {users.map((u) => {
              const st = STATUS_MAP[u.validationStatus] || { label: u.validationStatus, tone: "neutral" };
              return (
                <div key={u.id} style={{
                  background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card,
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{u.prenom} {u.nom}</span>
                    <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>{u.email}</span>
                    {u.companyName && <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>· {u.companyName}</span>}
                    {u.country && <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>· {u.country}</span>}
                  </div>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <ActionButton onClick={() => openHistory(u)}>Voir l'historique</ActionButton>
                    {u.validationStatus === "suspended" ? (
                      admin?.role === "superadmin" ? (
                        <ActionButton disabled={pendingAction === u.id} onClick={() => handleReactivate(u.id)}>
                          Réactiver
                        </ActionButton>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                          Réactivation réservée au superadmin
                        </span>
                      )
                    ) : u.validationStatus !== "rejected" ? (
                      <ActionButton variant="danger" disabled={pendingAction === u.id} onClick={() => { setSuspendTarget(u); setSuspendMotif(""); setSuspendDays(7); setSuspendError(null); }}>
                        Suspendre
                      </ActionButton>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchUsers(p, search, statusFilter); }} />
        </>
      )}

      {suspendTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: spacing.md,
        }}>
          <div style={{ background: "#fff", borderRadius: radius.md, padding: spacing.lg, width: "100%", maxWidth: 440, boxShadow: shadow.raised }}>
            <h3 style={{ margin: 0, marginBottom: spacing.sm, fontSize: typography.fontSizeLg, fontWeight: 700 }}>
              Suspendre {suspendTarget.prenom} {suspendTarget.nom}
            </h3>
            <p style={{ margin: 0, marginBottom: spacing.md, color: colors.textMuted, fontSize: typography.fontSizeSm }}>
              Indiquez un motif et une durée. L'utilisateur ne pourra plus se connecter jusqu'à la fin de la suspension.
            </p>

            <label style={{ display: "block", marginBottom: spacing.sm }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Motif</span>
              <textarea
                value={suspendMotif}
                onChange={(e) => setSuspendMotif(e.target.value)}
                rows={2}
                placeholder="Motif de la suspension..."
                style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: "8px 12px", fontSize: typography.fontSizeSm, fontFamily: typography.body }}
              />
            </label>

            <label style={{ display: "block", marginBottom: spacing.sm }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Durée de suspension (jours)</span>
              <Input
                type="number"
                min="1"
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
              />
            </label>

            {suspendError && <ErrorMessage>{suspendError}</ErrorMessage>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md }}>
              <Button variant="secondary" onClick={() => setSuspendTarget(null)}>Annuler</Button>
              <Button
                variant="danger"
                disabled={pendingAction === suspendTarget.id}
                onClick={() => {
                  const days = parseInt(suspendDays, 10);
                  if (!days || days < 1) { setSuspendError("La durée doit être un nombre de jours supérieur à 0."); return; }
                  handleSuspend(suspendTarget.id, suspendMotif, days);
                }}
              >
                {pendingAction === suspendTarget.id ? "..." : "Confirmer la suspension"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: spacing.md,
        }}>
          <div style={{ background: "#fff", borderRadius: radius.md, padding: spacing.lg, width: "100%", maxWidth: 640, maxHeight: "85vh", overflow: "auto", boxShadow: shadow.raised }}>
            <h3 style={{ margin: 0, marginBottom: spacing.sm, fontSize: typography.fontSizeLg, fontWeight: 700 }}>
              Historique de modération — {historyTarget.prenom} {historyTarget.nom}
            </h3>
            <p style={{ margin: 0, marginBottom: spacing.md, color: colors.textMuted, fontSize: typography.fontSizeSm }}>
              {historyTarget.email}
            </p>

            {historyError && <ErrorMessage>{historyError}</ErrorMessage>}
            {historyLoading ? <Spinner /> : (
              <>
                {(historyData?.moderationHistory || []).length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm }}>Aucune action de modération enregistrée pour cet utilisateur.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                    {historyData.moderationHistory.map((m) => (
                      <div key={m.id} style={{ background: "#f8fafc", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: spacing.md }}>
                        <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", marginBottom: 4 }}>
                          <Badge tone={m.action === "SUSPENSION" ? "danger" : m.action === "REACTIVATION" ? "success" : "neutral"}>{m.action}</Badge>
                          <span style={{ fontSize: 12, color: colors.textMuted }}>{m.createdAt ? new Date(m.createdAt).toLocaleString("fr-FR") : "—"}</span>
                        </div>
                        {m.motif && <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textPrimary }}>Motif : {m.motif}</p>}
                        {m.suspensionDurationDays != null && (
                          <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeSm, color: colors.textMuted }}>
                            Durée : {m.suspensionDurationDays} jour(s)
                            {m.suspensionEndDate ? ` — fin le ${new Date(m.suspensionEndDate).toLocaleDateString("fr-FR")}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: spacing.md }}>
              <Button variant="secondary" onClick={() => setHistoryTarget(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, disabled, variant = "default" }) {
  const isDanger = variant === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 14px",
        borderRadius: radius.sm,
        border: `1px solid ${isDanger ? colors.danger : colors.border}`,
        backgroundColor: "#fff",
        color: isDanger ? colors.danger : colors.textPrimary,
        fontSize: typography.fontSizeSm,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
