import { Link } from "react-router-dom";
import Card from "../../../components/molecules/Card";
import StatusBadge from "../../../components/molecules/StatusBadge";
import Button from "../../../components/atoms/Button";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function CurrentPlanCard({ subscription, compact }) {
  if (!subscription) return null;

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing.md,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ fontFamily: typography.display, fontSize: typography.fontSizeMd, margin: 0 }}>
            ✅ Plan actuel
          </h3>
          <h2 style={{ margin: `${spacing.sm}px 0 4px` }}>{subscription.planTitle}</h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            {subscription.price} · {subscription.billingCycle}
          </p>
        </div>

        <StatusBadge status={subscription.cancelAtPeriodEnd ? "canceled" : "active"} />
      </div>

      <p style={{ color: colors.textMuted, marginTop: spacing.md, marginBottom: 0 }}>
        {subscription.cancelAtPeriodEnd
          ? `Résiliation programmée — vous gardez l'accès jusqu'au ${subscription.renewalDate}, puis retour au plan Gratuit.`
          : `Prochain renouvellement le ${subscription.renewalDate}`}
      </p>

      {!compact && (
        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.lg, flexWrap: "wrap" }}>
          <Link to="/billing/subscription">
            <Button variant="secondary">Gérer mon abonnement</Button>
          </Link>

        </div>
      )}
    </Card>
  );
}
