import { useInView } from "../../hooks/useInView";

/**
 * Fait apparaître son contenu (fondu + léger glissement vers le haut) au
 * moment où il entre dans le viewport. `delay` (ms) permet d'orchestrer
 * un effet de cascade sur une série d'éléments (cartes, grilles...).
 */
export default function Reveal({ children, delay = 0, as: Tag = "div", style }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
