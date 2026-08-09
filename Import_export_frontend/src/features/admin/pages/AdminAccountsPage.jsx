import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { Navigate } from "react-router-dom";
import { getAdmins, createAdmin, deactivateAdmin, reactivateAdmin } from "../api/admin";
import Input from "../../../components/atoms/Input";
import Select from "../../../components/atoms/Select";
import Button from "../../../components/atoms/Button";
import Badge from "../../../components/atoms/Badge";
import Spinner from "../../../components/atoms/Spinner";
import ErrorMessage from "../../../components/atoms/ErrorMessage";
import { colors, radius, shadow, spacing, typography } from "../../../styles/tokens";

const ROLE_MAP = {
  superadmin: { label: "Super admin", tone: "primary" },
  moderateur: { label: "Modérateur", tone: "neutral" },
};

export default function AdminAccountsPage() {
  const { admin } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", nom: "", prenom: "", role: "moderateur" });

  useEffect(() => {
    getAdmins()
      .then(setAdmins)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (!admin) return <Navigate to="/admin/login" replace />;
  if (admin.role !== "superadmin") {
    return (
      <div>
        <span className="eyebrow">Administration</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>Comptes administrateurs</h1>
        <div style={{ marginTop: spacing.lg, background: colors.dangerBg, border: `1px solid ${colors.danger}`, borderRadius: radius.md, padding: spacing.md }}>
          Cette page est réservée aux super-administrateurs.
        </div>
      </div>
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const created = await createAdmin(form);
      setAdmins((prev) => [{ ...form, id: created.id, isActive: true, createdAt: null }, ...prev]);
      setShowCreate(false);
      setForm({ email: "", password: "", nom: "", prenom: "", role: "moderateur" });
    } catch (err) { setError(err.message); }
  }

  async function handleToggle(a) {
    setPendingAction(a.id);
    try {
      if (a.isActive) {
        await deactivateAdmin(a.id);
      } else {
        await reactivateAdmin(a.id);
      }
      setAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (err) { setError(err.message); }
    finally { setPendingAction(null); }
  }

  return (
    <div>
      <div style={{ marginBottom: spacing.xl, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md }}>
        <div>
          <span className="eyebrow">Administration</span>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
            Comptes administrateurs
          </h1>
          <p style={{ marginTop: 8, color: colors.textMuted }}>
            Créez et gérez les comptes d'administration (identité séparée, spec §4).
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Annuler" : "+ Nouvel administrateur"}
        </Button>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {showCreate && (
        <form onSubmit={handleCreate} style={{
          background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md,
          padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadow.card,
        }}>
          <h3 style={{ margin: `0 0 ${spacing.md}px` }}>Nouveau compte</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.md }}>
            <Input type="text" placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
            <Input type="text" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input type="password" placeholder="Mot de passe (8 caractères min.)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Select
              value={form.role}
              options={[
                { value: "moderateur", label: "Modérateur" },
                { value: "superadmin", label: "Super admin" },
              ]}
              onChange={(value) => setForm({ ...form, role: value })}
            />
          </div>
          <div style={{ marginTop: spacing.md }}>
            <Button type="submit">Créer le compte</Button>
          </div>
        </form>
      )}

      {isLoading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {admins.map((a) => {
            const role = ROLE_MAP[a.role] || { label: a.role, tone: "neutral" };
            return (
              <div key={a.id} style={{
                background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md,
                padding: spacing.md, boxShadow: shadow.card,
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm,
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{a.prenom} {a.nom}</span>
                  <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }}>{a.email}</span>
                  <div style={{ marginTop: spacing.xs, display: "flex", gap: spacing.sm, alignItems: "center" }}>
                    <Badge tone={role.tone}>{role.label}</Badge>
                    <Badge tone={a.isActive ? "success" : "danger"}>{a.isActive ? "Actif" : "Désactivé"}</Badge>
                  </div>
                </div>
                {a.id !== admin.id && (
                  <button
                    type="button"
                    disabled={pendingAction === a.id}
                    onClick={() => handleToggle(a)}
                    style={{
                      padding: "7px 14px", borderRadius: radius.sm,
                      border: `1px solid ${a.isActive ? colors.danger : colors.success}`,
                      backgroundColor: "#fff", color: a.isActive ? colors.danger : colors.success,
                      fontSize: typography.fontSizeSm, fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {a.isActive ? "Désactiver" : "Réactiver"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
