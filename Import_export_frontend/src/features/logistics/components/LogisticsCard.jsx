import { useState, useEffect } from "react";
import { FaTruck, FaRulerHorizontal, FaCalendarAlt, FaDollarSign } from "react-icons/fa";
import { convertCurrency, estimateLogistics } from "../../logistics/api/logistics";

const COUNTRY_MAP = {
  TN: "TN",
  TUNISIE: "TN",
  FR: "FR",
  FRANCE: "FR",
  IT: "IT",
  ITALIE: "IT",
  ES: "ES",
  ESPAGNE: "ES",
  DE: "DE",
  ALLEMAGNE: "DE",
  BE: "BE",
  BELGIQUE: "BE",
  NL: "NL",
  "PAYS-BAS": "NL",
  MA: "MA",
  MAROC: "MA",
  DZ: "DZ",
  ALGERIE: "DZ",
  EG: "EG",
  EGYPTE: "EG",
  TR: "TR",
  TURQUIE: "TR",
  CN: "CN",
  CHINE: "CN",
  IN: "IN",
  INDE: "IN",
  US: "US",
  "ETATS-UNIS": "US",
  CA: "CA",
  CANADA: "CA",
};

function normalizeCountry(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase().replace(/[ÉÈÀÇ]/g, (char) => ({ É: "E", È: "E", À: "A", Ç: "C" }[char] || char));
  const code = upper.replace(/[^A-Z]/g, "");
  if (code.length === 2 && /^[A-Z]{2}$/.test(code)) return code;

  return COUNTRY_MAP[upper] || COUNTRY_MAP[code] || null;
}

/**
 * Composant qui affiche les infos logistiques avec conversion de devise
 */
export default function LogisticsCard({
  distance_km,
  estimated_cost_usd,
  estimated_days,
  listingCountry,
  userCountry,
  listingType,
  originCountry,
  destinationCountry,
  listingCurrency = "USD",
}) {
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [convertedCost, setConvertedCost] = useState(estimated_cost_usd ?? 0);
  const [isConverting, setIsConverting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [conversionError, setConversionError] = useState(null);
  const [computedEstimate, setComputedEstimate] = useState({
    distance_km: distance_km ?? null,
    estimated_cost_usd: estimated_cost_usd ?? null,
    estimated_days: estimated_days ?? null,
  });

  const normalizedListingCountry = normalizeCountry(listingCountry || originCountry);
  const normalizedUserCountry = normalizeCountry(userCountry || destinationCountry);
  const normalizedType = String(listingType || "").toLowerCase();
  const isDemand = normalizedType === "demand" || normalizedType === "demande";
  const derivedOrigin = isDemand ? normalizedUserCountry : normalizedListingCountry;
  const derivedDestination = isDemand ? normalizedListingCountry : normalizedUserCountry;
  const effectiveOrigin = normalizeCountry(originCountry) || derivedOrigin;
  const effectiveDestination = normalizeCountry(destinationCountry) || derivedDestination;
  const hasValidCountryPair = Boolean(effectiveOrigin && effectiveDestination && effectiveOrigin !== effectiveDestination);

  useEffect(() => {
    if (distance_km != null && estimated_cost_usd != null && estimated_days != null) {
      setComputedEstimate({ distance_km, estimated_cost_usd, estimated_days });
      setIsEstimating(false);
      setIsConverting(false);
      return;
    }

    if (!hasValidCountryPair) {
      setComputedEstimate({
        distance_km: distance_km ?? null,
        estimated_cost_usd: estimated_cost_usd ?? null,
        estimated_days: estimated_days ?? null,
      });
      setIsEstimating(false);
      setIsConverting(false);
      return;
    }

    let isMounted = true;
    setIsEstimating(true);
    estimateLogistics(effectiveOrigin, effectiveDestination)
      .then((result) => {
        if (isMounted) {
          setComputedEstimate({
            distance_km: result.distance_km ?? distance_km ?? null,
            estimated_cost_usd: result.estimated_cost_usd ?? estimated_cost_usd ?? null,
            estimated_days: result.estimated_days ?? estimated_days ?? null,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setComputedEstimate({
            distance_km: distance_km ?? null,
            estimated_cost_usd: estimated_cost_usd ?? null,
            estimated_days: estimated_days ?? null,
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsEstimating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [distance_km, estimated_cost_usd, estimated_days, hasValidCountryPair, effectiveOrigin, effectiveDestination]);

  useEffect(() => {
    const baseCost = computedEstimate.estimated_cost_usd ?? estimated_cost_usd ?? 0;
    if (displayCurrency === "USD") {
      setConvertedCost(baseCost);
      setConversionError(null);
      return;
    }

    let isMounted = true;
    setIsConverting(true);
    setConversionError(null);

    convertCurrency(baseCost, "USD", displayCurrency)
      .then((result) => {
        if (isMounted) {
          setConvertedCost(result.converted_amount);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConversionError("Conversion non disponible");
          setDisplayCurrency("USD");
          setConvertedCost(baseCost);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsConverting(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [displayCurrency, computedEstimate.estimated_cost_usd, estimated_cost_usd]);

  const commonCurrencies = ["USD", "EUR", "GBP", "TND", "CAD", "CHF", "JPY", "CNY"];

  const hasLogisticsData =
    computedEstimate.distance_km != null ||
    computedEstimate.estimated_cost_usd != null ||
    computedEstimate.estimated_days != null;

  if (!hasValidCountryPair) return null;

  if (isEstimating && !hasLogisticsData) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "30px",
          marginTop: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#B8720A",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <FaTruck size={16} />
          Estimation logistique en cours...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        padding: "30px",
        marginTop: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        border: "1px solid #f1f5f9",
      }}
    >
      <h2
        style={{
          fontSize: "22px",
          marginBottom: "20px",
          color: "#14161C",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FaTruck size={20} style={{ color: "#B8720A" }} />
        📍 Informations logistiques
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Distance */}
        {computedEstimate.distance_km != null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#6B6D76",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <FaRulerHorizontal size={16} style={{ color: "#B8720A" }} />
              Distance
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#14161C",
              }}
            >
              {computedEstimate.distance_km.toLocaleString("en-US", { maximumFractionDigits: 1 })} km
            </div>
          </div>
        )}

        {/* Coût logistique */}
        {computedEstimate.estimated_cost_usd != null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#6B6D76",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <FaDollarSign size={16} style={{ color: "#B8720A" }} />
              Coût estimé
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#14161C",
              }}
            >
              {isConverting ? "..." : `${convertedCost?.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${displayCurrency}`}
            </div>

            {/* Sélecteur de devise */}
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              disabled={isConverting}
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #E4E2DC",
                backgroundColor: "#fff",
                cursor: isConverting ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: "500",
                opacity: isConverting ? 0.7 : 1,
              }}
            >
              {commonCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>

            {conversionError && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#dc2626",
                }}
              >
                {conversionError}
              </div>
            )}
          </div>
        )}

        {/* Délai logistique */}
        {computedEstimate.estimated_days != null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#6B6D76",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <FaCalendarAlt size={16} style={{ color: "#B8720A" }} />
              Délai estimé
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#14161C",
              }}
            >
              {computedEstimate.estimated_days} jour{computedEstimate.estimated_days > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {!hasLogisticsData && (
        <p style={{ marginTop: "12px", color: "#6B6D76", fontSize: "13px" }}>
          Aucune donnée logistique disponible pour cette annonce.
        </p>
      )}
    </div>
  );
}
