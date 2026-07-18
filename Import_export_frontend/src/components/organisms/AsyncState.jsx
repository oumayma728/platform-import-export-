import Spinner from "../atoms/Spinner";
import ErrorMessage from "../atoms/ErrorMessage";

/**
 * Enveloppe le pattern répétitif "isLoading / error / vide / contenu"
 * qui reviendrait dans CHAQUE page (annonces, matches, messages, factures...).
 */
export default function AsyncState({ isLoading, error, isEmpty, emptyLabel = "Aucun résultat.", children }) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (isEmpty) return <p style={{ color: "#666" }}>{emptyLabel}</p>;
  return children;
}
