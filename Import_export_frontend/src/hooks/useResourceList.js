import { useState, useEffect, useCallback } from "react";

/**
 * @param {Function} fetchFn - fonction API à appeler, ex: getListings
 * @param {object} initialFilters
 */
export function useResourceList(fetchFn, initialFilters = {}) {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!fetchFn) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFn(filters);
      setItems(data);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, filters, setFilters, isLoading, error, refetch: fetchItems };
}