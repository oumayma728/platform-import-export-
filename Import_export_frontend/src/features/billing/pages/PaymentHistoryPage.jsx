import { useEffect, useMemo, useState } from "react";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import Select from "../../../components/atoms/Select";
import BillingSubNav from "../components/BillingSubNav";
import InvoiceTable from "../components/InvoiceTable";
import { getInvoices } from "../api/billing";
import { colors, spacing, typography } from "../../../styles/tokens";

const STATUS_OPTIONS = [
  { value: "paid", label: "Payée" },
  { value: "pending", label: "En attente" },
  { value: "failed", label: "Échouée" },
];

export default function PaymentHistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let isMounted = true;
    getInvoices()
      .then((data) => isMounted && setInvoices(data))
      .catch((err) => isMounted && setError(err.message || "Erreur lors du chargement"))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!statusFilter) return invoices;
    return invoices.filter((invoice) => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.xs }}>
        Historique des paiements
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Toutes vos transactions passées, quel que soit le plan ou le mode de paiement utilisé.
      </p>

      <BillingSubNav />

      <SectionCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, flexWrap: "wrap", gap: spacing.sm }}>
          <p style={{ margin: 0, color: colors.textMuted }}>
            {filteredInvoices.length} transaction{filteredInvoices.length > 1 ? "s" : ""}
          </p>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="Tous les statuts"
          />
        </div>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={filteredInvoices.length === 0}
          emptyLabel="Aucune transaction ne correspond à ce filtre."
        >
          <InvoiceTable invoices={filteredInvoices} />
        </AsyncState>
      </SectionCard>
    </div>
  );
}
