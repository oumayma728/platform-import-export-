import { NavLink } from "react-router-dom";
import { colors, radius, spacing, typography } from "../../../styles/tokens";

const TABS = [
  { to: "/billing", label: "Vue d'ensemble" },
  { to: "/billing/subscription", label: "Mon abonnement" },
  { to: "/billing/history", label: "Historique des paiements" },
  { to: "/billing/plans", label: "Comparer les offres" },
  { to: "/billing/payment-methods", label: "Moyens de paiement" },
];

export default function BillingSubNav() {
  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: spacing.md,
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          style={({ isActive }) => ({
            textDecoration: "none",
            fontFamily: typography.body,
            fontSize: typography.fontSizeSm,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: radius.full,
            color: isActive ? "#fff" : colors.textMuted,
            backgroundColor: isActive ? colors.primary : colors.surface,
            transition: "background-color 0.15s ease, color 0.15s ease",
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
