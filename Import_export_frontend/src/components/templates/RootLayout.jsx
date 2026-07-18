import { useAuth } from "../../context/AuthContext";
import VisitorLayout from "./VisitorLayout";
import UserHeaderLayout from "./UserHeaderLayout";
import Spinner from "../atoms/Spinner";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  // Visiteur non connecte -> header avec Connexion/Inscription
  if (!user) {
    return <VisitorLayout />;
  }

  // Utilisateur connecte -> header avec navigation + Deconnexion
  return <UserHeaderLayout />;
}
