import { Link } from "react-router-dom";
import StatusBadge from "../../../components/molecules/StatusBadge";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function InvoiceTable({ invoices, compact }) {
  if (!invoices.length) {
    return <p style={{ color: colors.textMuted }}>Aucune transaction pour le moment.</p>;
  }

  return (
    // Sur mobile, la table (N°/Date/Méthode/Montant/Statut/action) est plus
    // large que l'écran : sans ce wrapper scrollable, les dernières colonnes
    // (Statut, "Voir le détail") sont simplement coupées et invisibles.
    // On rend l'overflow explicite (scroll horizontal) plutôt que de le
    // subir, et on fixe une largeur minimale pour que les cellules ne se
    // tassent pas au point de devenir illisibles.
    <div style={{ overflowX: "auto", marginLeft: -1, marginRight: -1 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: compact ? 480 : 620 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
            <th style={thStyle}>N°</th>
            <th style={thStyle}>Date</th>
            {!compact && <th style={thStyle}>Méthode</th>}
            <th style={thStyle}>Montant</th>
            <th style={thStyle}>Statut</th>
            <th style={thStyle}></th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={tdStyle}>{invoice.id}</td>
              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{invoice.date}</td>
              {!compact && <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{invoice.method}</td>}
              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{invoice.amount}</td>
              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                <StatusBadge status={invoice.status} />
              </td>
              <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                <Link
                  to={`/billing/invoices/${invoice.id}`}
                  style={{
                    fontFamily: typography.body,
                    fontSize: typography.fontSizeSm,
                    fontWeight: 600,
                    color: colors.primary,
                    textDecoration: "none",
                  }}
                >
                  Voir le détail →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: `${spacing.sm}px ${spacing.sm}px`,
  fontSize: typography.fontSizeSm,
  color: colors.textMuted,
  fontWeight: 600,
};

const tdStyle = {
  padding: `${spacing.sm + 2}px ${spacing.sm}px`,
  fontSize: typography.fontSizeBase,
  color: colors.textPrimary,
};
