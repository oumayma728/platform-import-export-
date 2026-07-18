import { useEffect, useRef, useState } from "react";

/**
 * Déclenche `true` la première fois que l'élément observé entre dans le
 * viewport, puis se désabonne (les animations de reveal ne doivent jouer
 * qu'une fois, pas à chaque scroll dans les deux sens).
 */
export function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Si le navigateur ne supporte pas IntersectionObserver, ou si la
    // préférence "reduced motion" est active, on affiche directement le
    // contenu sans animation plutôt que de risquer un élément resté invisible.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      options
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
