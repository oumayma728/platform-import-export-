import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: "Dashboard",
  },
  {
    to: "/admin/pending-companies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "File d'attente",
  },
];

export default function AdminSidebar() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  const linkBase = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    color: "#6b7280",
    textDecoration: "none",
    transition: "all 0.15s ease",
  };

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #ebebea",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid #f0f0ee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#14161C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                color: "#14161C",
                lineHeight: 1.2,
              }}
            >
              Import Export
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#B8720A",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Admin
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 12px", flex: 1 }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#d1d5db",
            fontFamily: "'Inter', sans-serif",
            padding: "0 4px",
            marginBottom: "6px",
            marginTop: "4px",
          }}
        >
          Navigation
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...linkBase,
              ...(isActive
                ? {
                    background: "#f6f5f2",
                    color: "#14161C",
                    fontWeight: 600,
                  }
                : {}),
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "#f9f9f8";
                e.currentTarget.style.color = "#14161C";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute("aria-current")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            <span style={{ opacity: 0.7 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer : infos admin + logout */}
      <div
        style={{
          borderTop: "1px solid #f0f0ee",
          padding: "16px 12px",
        }}
      >
        {/* Avatar admin */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "6px",
            background: "#f9f9f8",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#14161C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {adminUser?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#14161C",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Administrateur
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {adminUser?.email ?? ""}
            </div>
          </div>
        </div>

        {/* Bouton logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            fontSize: "13px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: "#6b7280",
            cursor: "pointer",
            transition: "all 0.15s ease",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
