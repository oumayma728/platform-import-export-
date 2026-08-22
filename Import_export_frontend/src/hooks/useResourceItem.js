import { useState, useEffect } from "react";

/**
 * Hook générique pour charger un item par id.
 * Réutilisé pour le détail d'une annonce, d'un match, d'une conversation, etc.
 */
export function useResourceItem(fetchByIdFn, id) {
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchByIdFn(id)
      .then((data) => {
        if (isMounted) setItem(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Erreur lors du chargement");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchByIdFn, id]);

  return { item, isLoading, error };
}
