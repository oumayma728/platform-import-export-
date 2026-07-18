import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowUp } from "react-icons/fa";
import Button from "../components/atoms/Button";
import Reveal from "../components/atoms/Reveal";
import StepCard from "../components/organisms/StepCard";
import CategoryGrid from "../components/organisms/CategoryGrid";
import FeatureGrid from "../components/organisms/FeatureGrid";
import TrustMarquee from "../components/organisms/TrustMarquee";
import TradeRouteIllustration from "../components/organisms/TradeRouteIllustration";
import { colors, spacing, typography } from "../styles/tokens";

const STEPS = [
  {
    icon: "🚀",
    title: "Créez votre compte",
    description: "Inscrivez-vous en tant qu'importateur ou exportateur et complétez votre profil professionnel.",
  },
  {
    icon: "📦",
    title: "Publiez votre annonce",
    description: "Déposez une offre d'exportation ou une demande d'importation détaillée en quelques minutes.",
  },
  {
    icon: "🤝",
    title: "Trouvez un partenaire",
    description: "Identifiez les meilleures opportunités commerciales et échangez directement avec les entreprises.",
  },
];

export default function LandingPage() {
  // --- Bouton "remonter en haut" ---
  // Apparaît uniquement après un certain scroll, pour ne pas encombrer
  // l'écran quand on est déjà en haut de la page.
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* HERO */}

      <div
        style={{
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
          backgroundColor: colors.ink,
          backgroundImage:
            `linear-gradient(160deg, ${colors.ink} 0%, ${colors.inkSoft} 100%)`,
          overflow: "hidden",
        }}
      >
        <div
          className="grid-hero"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: `${spacing.xxl}px ${spacing.xl}px`,
            alignItems: "center",
            gap: spacing.xl,
            minHeight: 520,
          }}
        >
          <div style={{ position: "relative" }}>
            

            <h1
              className="hero-fade-2"
              style={{
                fontFamily: typography.display,
                fontSize: 52,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                marginBottom: spacing.md,
              }}
            >
              Trouvez le partenaire commercial idéal
            </h1>

            <p
              className="hero-fade-3"
              style={{
                fontFamily: typography.body,
                fontSize: 18,
                color: "#B9BECF",
                maxWidth: 460,
                marginBottom: spacing.lg,
                lineHeight: 1.7,
              }}
            >
              Indeed² connecte exportateurs et importateurs
              partout dans le monde grâce à un système
              intelligent de mise en relation.
            </p>

            <div
              className="hero-fade-4"
              style={{
                display: "flex",
                gap: spacing.md,
                flexWrap: "wrap",
              }}
            >
              <Link to="/listings/create">
                <Button>
                  Publier une annonce →
                </Button>
              </Link>

              <Link to="/listings/catalog">
                <Button variant="secondary">
                  Voir les annonces
                </Button>
              </Link>
            </div>
          </div>

          <div className="hero-illustration hero-fade-3" style={{ height: 350 }}>
            <TradeRouteIllustration />
          </div>
        </div>
      </div>

      {/* BANDEAU DE CONFIANCE */}
      <TrustMarquee />

      {/* SECTEURS */}

      <div style={{ marginTop: spacing.xxl }}>
        <Reveal style={{ textAlign: "center", marginBottom: "36px" }}>
          <span className="eyebrow">Catalogue</span>
          <h2
            style={{
              fontFamily: typography.display,
              fontSize: 36,
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            Explorer par secteur
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <CategoryGrid />
        </Reveal>
      </div>

      {/* POURQUOI INDEED² */}

      <div style={{ marginTop: spacing.xxl }}>
        <Reveal style={{ textAlign: "center", marginBottom: "36px" }}>
          <span className="eyebrow">Pourquoi Indeed²</span>
          <h2
            style={{
              fontFamily: typography.display,
              fontSize: 36,
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            Tout ce qu'il faut pour commercer sereinement
          </h2>
        </Reveal>

        <FeatureGrid />
      </div>

      {/* COMMENT ÇA MARCHE */}

      <div style={{ marginTop: spacing.xxl, marginBottom: spacing.xxl }}>
        <Reveal style={{ textAlign: "center", marginBottom: "50px" }}>
          <span className="eyebrow">Fonctionnement</span>
          <h2
            style={{
              fontFamily: typography.display,
              fontSize: "40px",
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.01em",
              marginBottom: "16px",
            }}
          >
            Comment fonctionne Indeed² ?
          </h2>
        </Reveal>

        {/* Étapes numérotées : l'ordre porte une vraie information ici
            (il faut créer un compte avant de publier, publier avant
            de matcher), donc les jalons 01/02/03 sont justifiés. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120} style={{ height: "100%" }}>
              <StepCard step={i + 1} {...step} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* BOUTON REMONTER EN HAUT */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Remonter en haut de la page"
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            backgroundColor: colors.ink,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            zIndex: 1000,
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
}