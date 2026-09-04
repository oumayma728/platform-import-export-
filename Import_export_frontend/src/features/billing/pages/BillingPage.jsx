import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import AsyncState from "../../../components/organisms/AsyncState";
import SectionCard from "../../../components/molecules/SectionCard";
import Button from "../../../components/atoms/Button";
import BillingSubNav from "../components/BillingSubNav";
import UsageCard from "../components/UsageCard";
import CurrentPlanCard from "../components/CurrentPlanCard";
import PricingCard from "../components/PricingCard";
import InvoiceTable from "../components/InvoiceTable";
import SmartRecommendationBanner from "../components/SmartRecommendationBanner";
import {
  getUsage,
  getSubscription,
  getInvoices,
  getSmartRecommendation,
  waitForPlanUpdate,
} from "../api/billing";
import { mockPlans } from "../mocks/billing.mock";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function BillingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(false);

  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadBillingData() {
    if (!user) return;

    setIsLoading(true);
    try {
      const [usageData, subscriptionData, invoicesData, recommendationData] = await Promise.all([
        getUsage(),
        getSubscription(),
        getInvoices(),
        getSmartRecommendation(),
      ]);

      if (!isMountedRef.current) return;
      setUsage(usageData);
      setSubscription(subscriptionData);
      setInvoices(invoicesData);
      setRecommendation(recommendationData);
      setError(null);
    } catch (err) {
      if (isMountedRef.current) setError(err.message || "Erreur lors du chargement");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      setIsLoading(false);
      return;
    }
    loadBillingData();
    return () => {
      isMountedRef.current = false;
    };
    // location.key change à CHAQUE navigation, même vers la même route —
    // ça force un rechargement frais des données de facturation à chaque
    // retour sur cette page (ex: après un paiement), sans dépendre de
    // savoir si React a démonté ou non le composant.
  }, [user, location.key]);

  useEffect(() => {
    if (!user) return undefined;

    const pendingPlan = sessionStorage.getItem("pending-billing-refresh");
    if (!pendingPlan) return undefined;

    let cancelled = false;

    (async () => {
      await waitForPlanUpdate(pendingPlan, { attempts: 30, delayMs: 1000 });
      if (cancelled) return;
      sessionStorage.removeItem("pending-billing-refresh");
      await loadBillingData();
    })();

    return () => {
      cancelled = true;
    };
  }, [user, location.key]);

  useEffect(() => {
    if (!user) return undefined;

    const handleBillingUpdated = () => {
      loadBillingData();
    };

    window.addEventListener("billing-updated", handleBillingUpdated);
    return () => window.removeEventListener("billing-updated", handleBillingUpdated);
  }, [user]);

  if (authLoading) return <p>Chargement...</p>;

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.xs }}>
        💳 Facturation & Abonnement
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Gérez votre abonnement, vos moyens de paiement et consultez votre historique.
      </p>

      {user && <BillingSubNav />}

      {user && (
        <AsyncState isLoading={isLoading} error={error}>
          <SmartRecommendationBanner recommendation={recommendation} />
          <div className="grid-2-col" style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            {usage && <UsageCard usage={usage} />}
            {subscription && <CurrentPlanCard subscription={subscription} />}
          </div>
        </AsyncState>
      )}

      <SectionCard title="Nos offres">
        <div
          className="grid-3-col"
          style={{
            gap: spacing.lg,
            alignItems: "stretch",
          }}
        >
          {mockPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              subtitle={plan.subtitle}
              features={plan.features}
              buttonLabel={plan.buttonLabel}
              highlighted={plan.highlighted}
              isCurrent={subscription?.planId === plan.id}
              disabled={subscription?.planId === plan.id}
              onClick={() => navigate(`/billing/checkout/${plan.id}`)}
            />
          ))}
        </div>
      </SectionCard>

      {user && invoices.length > 0 && (
        <SectionCard title="Dernières transactions">
          <InvoiceTable invoices={invoices.slice(0, 3)} compact />
          <div style={{ textAlign: "center", marginTop: spacing.lg }}>
            <Link to="/billing/history">
              <Button variant="secondary">Voir tout l'historique</Button>
            </Link>
          </div>
        </SectionCard>
      )}

    </div>
  );
}