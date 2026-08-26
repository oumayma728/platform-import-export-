import { useEffect, useState } from "react";
import { Bell, CheckCheck, MailOpen, Mail } from "lucide-react";
import { colors, radius, spacing, typography } from "../styles/tokens";
import Spinner from "../components/atoms/Spinner";
import ErrorMessage from "../components/atoms/ErrorMessage";
import Pagination from "../components/molecules/Pagination";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = (p = page) => {
    setIsLoading(true);
    getNotifications({ page: p, limit: 20 })
      .then((data) => {
        setNotifications(data.notifications);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchNotifications(1); }, []);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, estLu: true } : n)));
    } catch (err) { setError(err.message); }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, estLu: true })));
    } catch (err) { setError(err.message); }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg }}>
        <div>
          <span className="eyebrow">Centre de notifications</span>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: colors.textPrimary }}>
            Notifications
          </h1>
          <p style={{ marginTop: 8, color: colors.textMuted }}>
            Décisions de modération, validation et alertes concernant votre compte.
          </p>
        </div>
        {total > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: radius.sm,
              border: `1px solid ${colors.border}`,
              backgroundColor: "#fff",
              color: colors.textPrimary,
              fontSize: typography.fontSizeSm,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <CheckCheck size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? <Spinner /> : (
        <>
          {notifications.length === 0 ? (
            <div style={{
              background: "#fff",
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              padding: "80px 40px",
              textAlign: "center",
            }}>
              <Bell size={48} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
              <h2 style={{ marginBottom: spacing.sm }}>Aucune notification</h2>
              <p style={{ color: colors.textMuted, margin: 0 }}>
                Vous serez prévenu ici de toute décision de modération vous concernant.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.estLu && handleMarkRead(n.id)}
                  style={{
                    background: n.estLu ? "#fff" : colors.primarySoft,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    boxShadow: "0 1px 2px rgba(14, 21, 38, 0.04)",
                    display: "flex",
                    gap: spacing.md,
                    alignItems: "flex-start",
                    cursor: n.estLu ? "default" : "pointer",
                  }}
                >
                  <div style={{ color: n.estLu ? colors.textMuted : colors.primary, marginTop: 2 }}>
                    {n.estLu ? <MailOpen size={18} /> : <Mail size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: typography.fontSizeBase, color: colors.textPrimary }}>
                      {n.titre}
                    </div>
                    {n.contenu && (
                      <p style={{ margin: `${spacing.xs}px 0 0`, color: colors.textMuted, fontSize: typography.fontSizeSm, lineHeight: 1.6 }}>
                        {n.contenu}
                      </p>
                    )}
                    {n.createdAt && (
                      <span style={{ color: colors.textMuted, fontSize: 12 }}>
                        {new Date(n.createdAt).toLocaleString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ marginTop: spacing.lg }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchNotifications(p); }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
