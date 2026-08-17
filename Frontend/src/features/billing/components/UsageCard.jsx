import Card from "../../../components/molecules/Card";
import { colors, spacing, typography, radius } from "../../../styles/tokens";

export default function UsageCard({ usage }) {
  const percentage = Math.min(100, (usage.usedChats / usage.maxChats) * 100);

  return (
    <Card>
      <h3 style={{ fontFamily: typography.display, fontSize: typography.fontSizeMd, margin: 0 }}>
        📨 Messages gratuits
      </h3>

      <h2 style={{ fontSize: typography.fontSizeXl, margin: `${spacing.sm}px 0 0` }}>
        {usage.usedChats} / {usage.maxChats}
      </h2>

      <p style={{ color: colors.textMuted, margin: `4px 0 ${spacing.md}px` }}>
        Messages gratuits utilisés ce mois-ci
      </p>

      <div
        style={{
          height: 10,
          background: colors.neutralBg,
          borderRadius: radius.full,
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: colors.primary,
            borderRadius: radius.full,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </Card>
  );
}
