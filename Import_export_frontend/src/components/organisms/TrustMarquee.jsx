import { ShieldCheck, Wheat, Zap, Shirt, Cpu, Car, FlaskConical, Building2, Cog } from "lucide-react";
import { colors, typography } from "../../styles/tokens";

// Certifications et secteurs réellement utilisés ailleurs dans l'app
// (formulaires de profil, filtres catalogue) — pas de faux logos clients.
const ITEMS = [
  { label: "ISO 9001", Icon: ShieldCheck },
  { label: "Agroalimentaire", Icon: Wheat },
  { label: "HACCP", Icon: ShieldCheck },
  { label: "Énergie", Icon: Zap },
  { label: "Textile", Icon: Shirt },
  { label: "CE", Icon: ShieldCheck },
  { label: "Électronique", Icon: Cpu },
  { label: "Automobile", Icon: Car },
  { label: "BIO", Icon: ShieldCheck },
  { label: "Cosmétique", Icon: FlaskConical },
  { label: "Construction", Icon: Building2 },
  { label: "Machines industrielles", Icon: Cog },
];

function Item({ label, Icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 32px",
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={colors.textMuted} strokeWidth={1.75} />
      <span
        style={{
          fontFamily: typography.body,
          fontSize: 14,
          fontWeight: 600,
          color: colors.textMuted,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function TrustMarquee() {
  return (
    <div
      className="marquee-viewport"
      style={{
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        width: "100vw",
        overflow: "hidden",
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
        padding: "22px 0",
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="marquee-track">
        {ITEMS.map((item) => (
          <Item key={`a-${item.label}`} {...item} />
        ))}
        {/* Duplication pour boucler le défilement sans coupure visible */}
        {ITEMS.map((item) => (
          <Item key={`b-${item.label}`} {...item} />
        ))}
      </div>
    </div>
  );
}
