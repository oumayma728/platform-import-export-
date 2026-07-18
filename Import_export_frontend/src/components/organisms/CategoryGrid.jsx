import { useMemo } from "react";
import { Wheat, Zap, Shirt, Cpu, Car, FlaskConical, Building2, Cog, Package } from "lucide-react";
import CategoryCard from "./CategoryCard";
import { spacing } from "../../styles/tokens";
import { useResourceList } from "../../hooks/useResourceList";
import { getListings, getMyListings } from "../../api/listings";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { label: "Agroalimentaire", category: "Agroalimentaire", Icon: Wheat },
  { label: "Énergie", category: "Énergie", Icon: Zap },
  { label: "Textile", category: "Textile", Icon: Shirt },
  { label: "Électronique", category: "Électronique", Icon: Cpu },
  { label: "Automobile", category: "Automobile", Icon: Car },
  { label: "Cosmétique", category: "Cosmétique", Icon: FlaskConical },
  { label: "Construction", category: "Construction", Icon: Building2 },
  { label: "Machines industrielles", category: "Machines industrielles", Icon: Cog },
  { label: "Emballage & Logistique", category: "Emballage & Logistique", Icon: Package },
];

const HIGHLIGHT_COUNT = 2;

export default function CategoryGrid() {
  const { user } = useAuth();
  const { items: listings } = useResourceList(user ? getMyListings : null);

  const topCategories = useMemo(() => {
    if (!user || listings.length === 0) return [];

    const counts = {};
    for (const listing of listings) {
      if (!listing.category) continue;
      counts[listing.category] = (counts[listing.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, HIGHLIGHT_COUNT)
      .map(([category]) => category);
  }, [user, listings]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gridAutoRows: "minmax(120px, auto)",
        gap: spacing.md,
      }}
    >
      {CATEGORIES.map((cat) => {
        const big = topCategories.includes(cat.category);
        return (
          <div key={cat.category} style={{ gridColumn: big ? "span 2" : "span 1" }}>
            <CategoryCard {...cat} big={big} count={listings.filter((l) => l.category === cat.category).length} />
          </div>
        );
      })}
    </div>
  );
}