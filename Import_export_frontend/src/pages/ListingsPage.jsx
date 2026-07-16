import { useMemo, useState, useEffect } from "react";
import { FaHeart, FaSearch } from "react-icons/fa";
import { getFavorites } from "../api/favorites";import { useSearchParams } from "react-router-dom";
import { useResourceList } from "../hooks/useResourceList";
import { getListings } from "../api/listings";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/organisms/FilterBar";
import ListingCard from "../components/organisms/ListingCard";
import AsyncState from "../components/organisms/AsyncState";
import Pagination from "../components/molecules/Pagination";
import { colors } from "../styles/tokens";

const COUNTRY_FIELD = {
  name: "country",
  placeholder: "Tous les pays",
  options: [
  { value: "Tunisie", label: "🇹🇳 Tunisie" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Italie", label: "🇮🇹 Italie" },
  { value: "Espagne", label: "🇪🇸 Espagne" },
  { value: "Allemagne", label: "🇩🇪 Allemagne" },
  { value: "Belgique", label: "🇧🇪 Belgique" },
  { value: "Pays-Bas", label: "🇳🇱 Pays-Bas" },
  { value: "Maroc", label: "🇲🇦 Maroc" },
  { value: "Algérie", label: "🇩🇿 Algérie" },
  { value: "Égypte", label: "🇪🇬 Égypte" },
  { value: "Turquie", label: "🇹🇷 Turquie" },
  { value: "Chine", label: "🇨🇳 Chine" },
  { value: "Inde", label: "🇮🇳 Inde" },
  { value: "États-Unis", label: "🇺🇸 États-Unis" },
  { value: "Canada", label: "🇨🇦 Canada" },
  ],
};

const CATEGORY_FIELD = {
  name: "category",
  placeholder: "Toutes les catégories",
  options: [
    { value: "Agroalimentaire", label: "Agroalimentaire" },
    { value: "Énergie", label: "Énergie" },
    { value: "Textile", label: "Textile" },
    { value: "Électronique", label: "Électronique" },
    { value: "Automobile", label: "Automobile" },
    { value: "Cosmétique", label: "Cosmétique" },
    { value: "Construction", label: "Construction" },
    { value: "Machines industrielles", label: "Machines industrielles" },
    { value: "Emballage & Logistique", label: "Emballage & Logistique" },
  ],
};

const TYPE_FIELD = {
  name: "type",
  placeholder: "Tous types",
  options: [
    { value: "offer", label: "Offres" },
    { value: "demand", label: "Demandes" },
  ],
};

export default function ListingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [favoriteIds, setFavoriteIds] =
useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] =
  useState(false);
  const categoryFromUrl = searchParams.get("category") || undefined;

  // Bornes du curseur de prix + liste des certifications disponibles,
  // calculées une seule fois à partir du catalogue complet (pas filtré),
  // pour que ça reste correct même quand une vraie API remplacera les mocks.
  const [catalogStats, setCatalogStats] = useState({
    minPrice: 0,
    maxPrice: 1000,
    certifications: [],
  });

  useEffect(() => {
    getListings().then((allListings) => {
      const prices = allListings.map((l) => l.price).filter((p) => typeof p === "number");
      const certifications = [
        ...new Set(allListings.flatMap((l) => l.certifications || [])),
      ].sort();
      setCatalogStats({
        minPrice: prices.length ? Math.floor(Math.min(...prices)) : 0,
        maxPrice: prices.length ? Math.ceil(Math.max(...prices)) : 1000,
        certifications,
      });
    });
  }, []);

  // Un importateur cherche des OFFRES (ce que proposent les exportateurs).
  // Un exportateur cherche des DEMANDES (ce que veulent les importateurs).
  const forcedType = user?.role === "importer" ? "offer" : user?.role === "exporter" ? "demand" : undefined;

  useEffect(() => {
  getFavorites().then((favorites) => {
    setFavoriteIds(
      favorites.map(
        (fav) => fav.listingId
      )
    );
  });
}, []);

  const fields = useMemo(() => {
    const base = forcedType ? [COUNTRY_FIELD, CATEGORY_FIELD] : [TYPE_FIELD, COUNTRY_FIELD, CATEGORY_FIELD];
    return [
      ...base,
      {
        name: "price",
        type: "price-range",
        label: "Prix",
        min: catalogStats.minPrice,
        max: catalogStats.maxPrice,
        unit: "$",
      },
      {
        name: "certifications",
        type: "certifications",
        label: "Certifications",
        options: catalogStats.certifications,
      },
    ];
  }, [forcedType, catalogStats]);

  const { items: allItems, filters, setFilters, isLoading, error } = useResourceList(getListings, {
    ...(forcedType ? { type: forcedType } : {}),
    ...(categoryFromUrl ? { category: categoryFromUrl } : {}),
  });

  // --- Recherche textuelle ---
  // Champ local + debounce pour éviter un appel GET à chaque frappe ;
  // au bout de 300ms d'inactivité, on répercute la valeur dans `filters.q`,
  // ce qui déclenche l'appel API GET /listings?q=... (via useResourceList).
  const [searchInput, setSearchInput] = useState(filters.q || "");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput || undefined }));
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // On ne montre jamais ses propres annonces dans le catalogue : c'est un
  // catalogue pour trouver des correspondances chez d'autres entreprises.
  const items = user ? allItems.filter((listing) => listing.ownerId !== user.id) : allItems;
const displayedItems =
  showFavoritesOnly
    ? items.filter((listing) =>
        favoriteIds.includes(
          listing.id
        )
      )
    : items;

  // --- Tri ---
  const [sortBy, setSortBy] = useState("relevance");
  const sortedItems = useMemo(() => {
    if (sortBy === "price-asc") {
      return [...displayedItems].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...displayedItems].sort((a, b) => b.price - a.price);
    }
    // "Pertinence" = ordre renvoyé par l'API, sans tri supplémentaire côté client
    return displayedItems;
  }, [displayedItems, sortBy]);

  // --- Pagination ---
  const PAGE_SIZE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const paginatedItems = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Revenir à la page 1 si les filtres, le tri, ou les favoris changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, showFavoritesOnly]);
  return (
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: "38px",
          fontWeight: "800",
        }}
      >
        Catalogue des annonces
      </h1>
      {forcedType && (
        <p style={{ color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 16 }}>
          Affichage des {forcedType === "offer" ? "offres" : "demandes"} correspondant à votre profil.
        </p>
      )}
<div
  style={{
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  }}
>
  <button
    onClick={() =>
      setShowFavoritesOnly(false)
    }
    style={{
      border: "none",
      borderRadius: "14px",
      padding: "10px 18px",
      cursor: "pointer",
      fontWeight: 600,
      background:
        !showFavoritesOnly
          ? "#B8720A"
          : "#f1f5f9",
      color:
        !showFavoritesOnly
          ? "#fff"
          : "#475569",
    }}
  >
    Toutes
  </button>

  <button
    onClick={() =>
      setShowFavoritesOnly(true)
    }
    style={{
      border: "none",
      borderRadius: "14px",
      padding: "10px 18px",
      cursor: "pointer",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background:
        showFavoritesOnly
          ? "#ef4444"
          : "#fff1f2",
      color:
        showFavoritesOnly
          ? "#fff"
          : "#C22D2D",
    }}
  >
    <FaHeart />
    Favoris
  </button>
</div>
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          maxWidth: "480px",
        }}
      >
        <FaSearch
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: colors.textMuted,
            fontSize: "14px",
          }}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher un produit, une catégorie, un pays..."
          style={{
            width: "100%",
            padding: "12px 16px 12px 40px",
            borderRadius: "14px",
            border: "1px solid #E4E2DC",
            fontSize: "14px",
            backgroundColor: "#fff",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <FilterBar fields={fields} filters={filters} onChange={setFilters} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
          {sortedItems.length} annonce{sortedItems.length > 1 ? "s" : ""}
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          Trier par
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #E4E2DC",
              fontSize: 14,
              backgroundColor: "#fff",
            }}
          >
            <option value="relevance">Pertinence</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={sortedItems.length === 0}
        emptyLabel="Aucune annonce ne correspond à ces filtres."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {paginatedItems.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </AsyncState>
    </div>
  );
}
