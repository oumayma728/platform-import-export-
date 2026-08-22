import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { useResourceItem } from "../../../hooks/useResourceItem";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import StatusBadge from "../../../components/molecules/StatusBadge";
import Button from "../../../components/atoms/Button";
import { getInvoiceById } from "../api/billing";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { item: invoice, isLoading, error } = useResourceItem(getInvoiceById, id);

  function handleDownload() {
    window.alert(
      `Téléchargement du PDF pour la facture ${id} — fonctionnalité branchée dès que l'API de facturation sera disponible.`
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/billing/history")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: colors.textMuted,
          fontSize: typography.fontSizeBase,
          cursor: "pointer",
          padding: 0,
          marginBottom: spacing.md,
        }}
      >
        <ArrowLeft size={16} /> Retour à l'historique
      </button>

      <AsyncState isLoading={isLoading} error={error}>
        {invoice && (
          <SectionCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: spacing.lg,
                flexWrap: "wrap",
                gap: spacing.md,
              }}
            >
              <div>
                <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeLg, margin: 0 }}>
                  Facture {invoice.id}
                </h1>
                <p style={{ color: colors.textMuted, margin: "4px 0 0" }}>{invoice.description}</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            <div
              className="grid-2-col"
              style={{
                rowGap: spacing.md,
                columnGap: spacing.lg,
                padding: spacing.lg,
                backgroundColor: colors.surface,
                borderRadius: 16,
                marginBottom: spacing.lg,
              }}
            >
              <Field label="Date" value={invoice.date} />
              <Field label="Montant" value={invoice.amount} />
              <Field label="Offre" value={invoice.planTitle} />
              <Field label="Méthode de paiement" value={invoice.method} />
            </div>

            <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
              <Button onClick={handleDownload}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Download size={16} /> Télécharger le PDF
                </span>
              </Button>
              <Link to="/billing/history">
                <Button variant="secondary">Voir toutes les factures</Button>
              </Link>
            </div>
          </SectionCard>
        )}
      </AsyncState>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: typography.fontSizeSm, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: typography.fontSizeMd, fontWeight: 700, color: colors.textPrimary }}>
        {value}
      </p>
    </div>
  );
}
