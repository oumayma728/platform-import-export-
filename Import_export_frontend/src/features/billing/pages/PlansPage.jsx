import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncState from "../../../components/organisms/AsyncState";
import BillingSubNav from "../components/BillingSubNav";
import PricingCard from "../components/PricingCard";
import SmartRecommendationBanner from "../components/SmartRecommendationBanner";
import { getSubscription, getSmartRecommendation } from "../api/billing";
import { mockPlans } from "../mocks/billing.mock";
import { colors, spacing, typography } from "../../../styles/tokens";

export default function PlansPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getSubscription(), getSmartRecommendation()])
      .then(([sub, rec]) => {
        if (!isMounted) return;
        setSubscription(sub);
        setRecommendation(rec);
      })
      .catch((err) => isMounted && setError(err.message || "Erreur lors du chargement"))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: typography.display, fontSize: typography.fontSizeXl, fontWeight: 800, marginBottom: spacing.xs }}>
        Comparer les offres
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Choisissez la formule adaptée à votre activité. Vous pourrez en changer à tout moment.
      </p>

      <BillingSubNav />

      <AsyncState isLoading={isLoading} error={error}>
        <SmartRecommendationBanner recommendation={recommendation} />
        <div
          className="grid-3-col"
          style={{
            gap: spacing.lg,
            alignItems: "stretch",
          }}
        >
          {mockPlans
            // Seul le plan Gratuit (essai) ne peut pas être repris une fois
            // utilisé, pour éviter les abus. Les plans payants (pay-per-use,
            // premium) doivent toujours rester proposables, sinon un
            // utilisateur ayant déjà été Premium ne pourrait plus jamais
            // se réabonner depuis cette page.
            .filter((plan) => !(plan.id === "free" && subscription?.usedPlanIds?.includes("free")))
            .map((plan) => (
              <PricingCard
                key={plan.id}
                title={plan.title}
                price={plan.price}
                subtitle={plan.subtitle}
                features={plan.features}
                buttonLabel={subscription?.planId === plan.id ? "Plan actuel" : plan.buttonLabel}
                highlighted={plan.highlighted}
                isCurrent={subscription?.planId === plan.id}
                disabled={subscription?.planId === plan.id}
                onClick={() => navigate(`/billing/checkout/${plan.id}`)}
              />
            ))}
        </div>
      </AsyncState>
    </div>
  );
}
