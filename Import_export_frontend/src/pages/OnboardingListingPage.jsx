import { useNavigate } from "react-router-dom";
import Card from "../components/molecules/Card";
import Button from "../components/atoms/Button";
import { colors, typography } from "../styles/tokens";

export default function OnboardingListingPage() {
  const navigate = useNavigate();

  return (
    <Card>
      <h1 style={{ fontSize: typography.fontSizeLg, marginBottom: 8 }}>
        Publier votre première annonce ?
      </h1>
      <p style={{ color: colors.textMuted, marginBottom: 20 }}>
        Créez une annonce maintenant pour commencer à recevoir des correspondances,
        ou passez cette étape — vous pourrez le faire plus tard depuis le catalogue.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Button onClick={() => navigate("/listings/create")}>Créer une annonce</Button>
        <Button variant="secondary" onClick={() => navigate("/listings/catalog")}>
          Ignorer pour l'instant
        </Button>
      </div>
    </Card>
  );
}
