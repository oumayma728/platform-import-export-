import { CreditCard, Wallet } from "lucide-react";
import Card from "../../../components/molecules/Card";
import Badge from "../../../components/atoms/Badge";
import Button from "../../../components/atoms/Button";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function PaymentMethodCard({ method, onSetDefault, onRemove }) {
  const isCard = method.type === "card";

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: colors.primarySoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isCard ? (
            <CreditCard size={20} color={colors.primary} />
          ) : (
            <Wallet size={20} color={colors.primary} />
          )}
        </div>

        <div style={{ flexGrow: 1 }}>
          {isCard ? (
            <>
              <p style={{ margin: 0, fontWeight: 700, color: colors.textPrimary }}>
                {method.brand} •••• {method.last4}
              </p>
              <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textMuted }}>
                Expire {method.expiry} · {method.holder}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 700, color: colors.textPrimary }}>PayPal</p>
              <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textMuted }}>
                {method.email}
              </p>
            </>
          )}
        </div>

        {method.isDefault && <Badge tone="primary">Par défaut</Badge>}
      </div>

      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
        {!method.isDefault && (
          <Button variant="secondary" onClick={() => onSetDefault(method.id)}>
            Définir par défaut
          </Button>
        )}
        <Button variant="danger" onClick={() => onRemove(method.id)}>
          Supprimer
        </Button>
      </div>
    </Card>
  );
}
