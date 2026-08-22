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
        </div>

        <StatusBadge status={subscription.cancelAtPeriodEnd ? "canceled" : "active"} />
      </div>


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
