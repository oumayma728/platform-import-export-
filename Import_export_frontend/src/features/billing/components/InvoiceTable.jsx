import { Link } from "react-router-dom";
import StatusBadge from "../../../components/molecules/StatusBadge";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function InvoiceTable({ invoices, compact }) {
  if (!invoices.length) {
    return <p style={{ color: colors.textMuted }}>Aucune transaction pour le moment.</p>;
  }

  return (
    <table width="100%" style={{ borderCollapse: "collapse" }}>
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
            <td style={tdStyle}>{invoice.date}</td>
            {!compact && <td style={tdStyle}>{invoice.method}</td>}
            <td style={tdStyle}>{invoice.amount}</td>
            <td style={tdStyle}>
              <StatusBadge status={invoice.status} />
            </td>
            <td style={{ ...tdStyle, textAlign: "right" }}>
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
