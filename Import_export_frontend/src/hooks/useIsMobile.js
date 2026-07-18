import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/**
 * Détecte si on est sous le seuil "mobile" (768px), en se réabonnant aux
 * changements de taille d'écran/orientation. Utilisé pour la messagerie :
 * sous ce seuil on affiche UNE seule vue à la fois (liste OU conversation,
 * comme Messenger sur mobile), au-dessus les deux côte à côte.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);

    // Safari < 14 n'a pas addEventListener sur MediaQueryList.
    if (mql.addEventListener) mql.addEventListener("change", handleChange);
    else mql.addListener(handleChange);

    setIsMobile(mql.matches);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handleChange);
      else mql.removeListener(handleChange);
    };
  }, []);

  return isMobile;
}
