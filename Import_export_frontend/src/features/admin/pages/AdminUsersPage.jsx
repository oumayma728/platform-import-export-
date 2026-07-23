import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getUsers, suspendUser, reactivateUser } from "../api/admin";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const STATUS_LABELS = {
  pending: { label: "En attente", color: "#D97706" },
  validated: { label: "Validé", color: colors.success },
  rejected: { label: "Rejeté", color: colors.danger },
  suspended: { label: "Suspendu", color: "#6B7280" },
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

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

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search, statusFilter);
  }

  async function handleSuspend(userId) {
    setPendingAction(userId);
    try {
      await suspendUser(userId, "Suspendu par l'administrateur");
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

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.lg, color: colors.textPrimary }}>
        Gestion des utilisateurs
      </h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
        <input
          type="text" placeholder="Rechercher par nom, email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase }}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); fetchUsers(1, search, e.target.value); }}
          style={{ padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: typography.fontSizeBase }}>
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validé</option>
          <option value="rejected">Rejeté</option>
          <option value="suspended">Suspendu</option>
        </select>
        <button type="submit" style={{ padding: "10px 20px", border: "none", borderRadius: radius.sm, backgroundColor: colors.primary, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Rechercher
        </button>
      </form>

      {error && <div style={{ padding: "10px 14px", borderRadius: radius.sm, backgroundColor: colors.dangerBg, color: colors.danger, marginBottom: spacing.md }}>{error}</div>}

      {isLoading ? <p style={{ color: colors.textMuted }}>Chargement...</p> : (
        <>
          <p style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginBottom: spacing.md }}>{total} utilisateur(s) trouvé(s)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {users.map((u) => {
              const st = STATUS_LABELS[u.validationStatus] || { label: u.validationStatus, color: "#666" };
              return (
                <div key={u.id} style={{
                  background: colors.surfaceRaised, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing.md, boxShadow: shadow.card,
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: typography.fontSizeBase }}>{u.prenom} {u.nom}</span>
                    <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>{u.email}</span>
                    {u.companyName && <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>· {u.companyName}</span>}
                    {u.country && <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>· {u.country}</span>}
                  </div>
                  <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <span style={{ fontSize: typography.fontSizeSm, fontWeight: 600, color: st.color, padding: "3px 10px", borderRadius: radius.full, backgroundColor: `${st.color}15` }}>{st.label}</span>
                    {u.validationStatus === "suspended" ? (
                      <button disabled={pendingAction === u.id} onClick={() => handleReactivate(u.id)}
                        style={{ padding: "5px 12px", border: `1px solid ${colors.success}`, borderRadius: radius.sm, background: "#fff", color: colors.success, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                        Réactiver
                      </button>
                    ) : u.validationStatus !== "rejected" ? (
                      <button disabled={pendingAction === u.id} onClick={() => handleSuspend(u.id)}
                        style={{ padding: "5px 12px", border: `1px solid ${colors.danger}`, borderRadius: radius.sm, background: "#fff", color: colors.danger, fontWeight: 600, fontSize: typography.fontSizeSm, cursor: "pointer" }}>
                        Suspendre
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", marginTop: spacing.lg }}>
              <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchUsers(p, search, statusFilter); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
                Précédent
              </button>
              <span style={{ padding: "8px 12px", fontSize: typography.fontSizeSm, color: colors.textMuted }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchUsers(p, search, statusFilter); }}
                style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: "#fff", fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
