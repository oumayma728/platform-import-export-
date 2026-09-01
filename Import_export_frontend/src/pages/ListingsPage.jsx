import { useMemo, useState, useEffect } from "react";
import { FaHeart, FaSearch } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

import { getFavorites } from "../api/favorites";
import { getListings } from "../api/listings";
import { getReferenceOptions } from "../api/referenceOptions";

import { useResourceList } from "../hooks/useResourceList";
import { useAuth } from "../context/AuthContext";

import FilterBar from "../components/organisms/FilterBar";
import ListingCard from "../components/organisms/ListingCard";
import AsyncState from "../components/organisms/AsyncState";
import Pagination from "../components/molecules/Pagination";

import { colors } from "../styles/tokens";
import { toRoleArray } from "../utils/roles";


/* =========================================================
   FILTRE TYPE D'ANNONCE

   Celui-ci reste statique car il s'agit de valeurs métier :
   offer / demand
========================================================= */

const TYPE_FIELD = {
  name: "type",
  placeholder: "Tous types",
  options: [
    {
      value: "offer",
      label: "Offres",
    },
    {
      value: "demand",
      label: "Demandes",
    },
  ],
};


export default function ListingsPage() {
  const { user } = useAuth();

  const [searchParams] = useSearchParams();


  /* =========================================================
     FAVORIS
  ========================================================= */

  const [favoriteIds, setFavoriteIds] = useState([]);

  const [showFavoritesOnly, setShowFavoritesOnly] =
    useState(false);


  /* =========================================================
     REFERENTIELS DYNAMIQUES

     Ces valeurs viennent maintenant du backend :
     GET /api/reference-options/category
     GET /api/reference-options/country
  ========================================================= */

  const [categoryOptions, setCategoryOptions] =
    useState([]);

  const [countryOptions, setCountryOptions] =
    useState([]);

  const [referencesLoading, setReferencesLoading] =
    useState(true);

  const [referencesError, setReferencesError] =
    useState(null);


  /* =========================================================
     CATÉGORIE FOURNIE DANS L'URL

     Exemple :
     /listings/catalog?category=Cosmétique
  ========================================================= */

  const categoryFromUrl =
    searchParams.get("category") || undefined;


  /* =========================================================
     CHARGER LES REFERENTIELS DEPUIS POSTGRESQL
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadReferenceOptions() {
      setReferencesLoading(true);
      setReferencesError(null);

      try {
        const [
          categories,
          countries,
        ] = await Promise.all([
          getReferenceOptions("category"),
          getReferenceOptions("country"),
        ]);

        if (cancelled) {
          return;
        }


        /* -----------------------------------------------------
           CATÉGORIES
        ----------------------------------------------------- */

        const mappedCategories = (
          Array.isArray(categories)
            ? categories
            : []
        ).map((item) => ({
          value: item.value,
          label:
            item.label ||
            item.value,
        }));


        /* -----------------------------------------------------
           PAYS
        ----------------------------------------------------- */

        const mappedCountries = (
          Array.isArray(countries)
            ? countries
            : []
        ).map((item) => ({
          value: item.value,
          label:
            item.label ||
            item.value,
        }));


        setCategoryOptions(
          mappedCategories
        );

        setCountryOptions(
          mappedCountries
        );
      } catch (error) {
        console.error(
          "Erreur chargement des référentiels :",
          error
        );

        if (!cancelled) {
          setReferencesError(
            "Impossible de charger les pays et catégories."
          );
        }
      } finally {
        if (!cancelled) {
          setReferencesLoading(false);
        }
      }
    }

    loadReferenceOptions();

    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================================================
     CONSTRUCTION DYNAMIQUE DU CHAMP PAYS
  ========================================================= */

  const countryField = useMemo(
    () => ({
      name: "country",
      placeholder: referencesLoading
        ? "Chargement des pays..."
        : "Tous les pays",

      options: countryOptions,
    }),
    [
      countryOptions,
      referencesLoading,
    ]
  );


  /* =========================================================
     CONSTRUCTION DYNAMIQUE DU CHAMP CATEGORIE
  ========================================================= */

  const categoryField = useMemo(
    () => ({
      name: "category",
      placeholder: referencesLoading
        ? "Chargement des catégories..."
        : "Toutes les catégories",

      options: categoryOptions,
    }),
    [
      categoryOptions,
      referencesLoading,
    ]
  );


  /* =========================================================
     STATISTIQUES DU CATALOGUE

     - prix min
     - prix max
     - certifications
  ========================================================= */

  const [catalogStats, setCatalogStats] =
    useState({
      minPrice: 0,
      maxPrice: 1000,
      certifications: [],
    });


  useEffect(() => {
    let cancelled = false;

    async function loadCatalogStats() {
      try {
        const allListings =
          await getListings();

        if (cancelled) {
          return;
        }

        const safeListings =
          Array.isArray(allListings)
            ? allListings
            : [];


        const prices = safeListings
          .map(
            (listing) =>
              listing.price
          )
          .filter(
            (price) =>
              typeof price ===
                "number" &&
              Number.isFinite(price)
          );


        const certifications = [
          ...new Set(
            safeListings.flatMap(
              (listing) =>
                listing.certifications ||
                []
            )
          ),
        ].sort();


        setCatalogStats({
          minPrice:
            prices.length
              ? Math.floor(
                  Math.min(...prices)
                )
              : 0,

          maxPrice:
            prices.length
              ? Math.ceil(
                  Math.max(...prices)
                )
              : 1000,

          certifications,
        });
      } catch (error) {
        console.error(
          "Erreur chargement statistiques catalogue :",
          error
        );
      }
    }

    loadCatalogStats();

    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================================================
     ROLE UTILISATEUR

     Importateur :
     → recherche des offres

     Exportateur :
     → recherche des demandes
  ========================================================= */

  const userRoles =
    toRoleArray(user?.role);

  const isExporterOnly =
    userRoles.includes("exporter") &&
    !userRoles.includes("importer");

  const isImporterOnly =
    userRoles.includes("importer") &&
    !userRoles.includes("exporter");


  const forcedType =
    isExporterOnly
      ? "demand"
      : isImporterOnly
      ? "offer"
      : undefined;


  /* =========================================================
     FAVORIS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const favorites =
          await getFavorites();

        if (cancelled) {
          return;
        }

        setFavoriteIds(
          (
            Array.isArray(favorites)
              ? favorites
              : []
          ).map(
            (favorite) =>
              favorite.listingId
          )
        );
      } catch (error) {
        console.error(
          "Erreur chargement favoris :",
          error
        );
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================================================
     CHAMPS DU FILTER BAR

     Pays et Catégorie utilisent maintenant
     les valeurs récupérées depuis PostgreSQL.
  ========================================================= */

  const fields = useMemo(() => {
    const baseFields =
      forcedType
        ? [
            countryField,
            categoryField,
          ]
        : [
            TYPE_FIELD,
            countryField,
            categoryField,
          ];

    return [
      ...baseFields,

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
        options:
          catalogStats.certifications,
      },
    ];
  }, [
    forcedType,
    countryField,
    categoryField,
    catalogStats,
  ]);


  /* =========================================================
     ANNONCES

     useResourceList transmet les filtres à getListings.

     Exemple :
     GET /api/listings?category=Bois
  ========================================================= */

  const {
    items: allItems,
    filters,
    setFilters,
    isLoading,
    error,
  } = useResourceList(
    getListings,
    {
      ...(forcedType
        ? {
            type: forcedType,
          }
        : {}),

      ...(categoryFromUrl
        ? {
            category:
              categoryFromUrl,
          }
        : {}),
    }
  );


  /* =========================================================
     RECHERCHE TEXTUELLE

     Debounce 300 ms
  ========================================================= */

  const [
    searchInput,
    setSearchInput,
  ] = useState(
    filters.q || ""
  );


  useEffect(() => {
    const timeoutId =
      setTimeout(() => {
        setFilters(
          (previous) => ({
            ...previous,

            q:
              searchInput.trim() ||
              undefined,
          })
        );
      }, 300);

    return () =>
      clearTimeout(
        timeoutId
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);


  /* =========================================================
     NE PAS AFFICHER SES PROPRES ANNONCES
  ========================================================= */

  const items = user
    ? allItems.filter(
        (listing) =>
          String(
            listing.ownerId
          ) !==
          String(user.id)
      )
    : allItems;


  /* =========================================================
     FAVORIS UNIQUEMENT
  ========================================================= */

  const displayedItems =
    showFavoritesOnly
      ? items.filter(
          (listing) =>
            favoriteIds.some(
              (favoriteId) =>
                String(
                  favoriteId
                ) ===
                String(
                  listing.id
                )
            )
        )
      : items;


  /* =========================================================
     TRI
  ========================================================= */

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "relevance"
  );


  const sortedItems =
    useMemo(() => {
      if (
        sortBy ===
        "price-asc"
      ) {
        return [
          ...displayedItems,
        ].sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );
      }

      if (
        sortBy ===
        "price-desc"
      ) {
        return [
          ...displayedItems,
        ].sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );
      }

      /*
       * Pertinence :
       * on conserve l'ordre renvoyé
       * par le backend.
       */

      return displayedItems;
    }, [
      displayedItems,
      sortBy,
    ]);


  /* =========================================================
     PAGINATION
  ========================================================= */

  const PAGE_SIZE = 9;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedItems.length /
          PAGE_SIZE
      )
    );


  const paginatedItems =
    sortedItems.slice(
      (
        currentPage - 1
      ) * PAGE_SIZE,

      currentPage *
        PAGE_SIZE
    );


  /*
   * Retour automatique à la première page
   * lorsque les filtres changent.
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters,
    sortBy,
    showFavoritesOnly,
  ]);


  /* =========================================================
     AFFICHAGE
  ========================================================= */

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


      {/* ===============================================
          TYPE FORCÉ SELON LE RÔLE
      =============================================== */}

      {forcedType && (
        <p
          style={{
            color:
              colors.textMuted,

            fontSize: 14,

            marginTop: 4,
            marginBottom: 16,
          }}
        >
          Affichage des{" "}
          {forcedType === "offer"
            ? "offres"
            : "demandes"}{" "}
          correspondant à votre profil.
        </p>
      )}


      {/* ===============================================
          ERREUR DE CHARGEMENT REFERENTIEL
      =============================================== */}

      {referencesError && (
        <div
          style={{
            marginBottom: 16,
            padding:
              "10px 14px",

            borderRadius: 10,

            background:
              "#fff7ed",

            color:
              "#9a3412",

            fontSize: 13,
          }}
        >
          ⚠️ {referencesError}
        </div>
      )}


      {/* ===============================================
          TOUTES / FAVORIS
      =============================================== */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"

          onClick={() =>
            setShowFavoritesOnly(
              false
            )
          }

          style={{
            border: "none",
            borderRadius:
              "14px",

            padding:
              "10px 18px",

            cursor:
              "pointer",

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
          type="button"

          onClick={() =>
            setShowFavoritesOnly(
              true
            )
          }

          style={{
            border: "none",
            borderRadius:
              "14px",

            padding:
              "10px 18px",

            cursor:
              "pointer",

            fontWeight: 600,

            display: "flex",
            alignItems:
              "center",

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


      {/* ===============================================
          RECHERCHE
      =============================================== */}

      <div
        style={{
          position:
            "relative",

          marginBottom:
            "20px",

          maxWidth:
            "480px",
        }}
      >
        <FaSearch
          style={{
            position:
              "absolute",

            left:
              "14px",

            top:
              "50%",

            transform:
              "translateY(-50%)",

            color:
              colors.textMuted,

            fontSize:
              "14px",
          }}
        />

        <input
          type="text"

          value={
            searchInput
          }

          onChange={(event) =>
            setSearchInput(
              event.target.value
            )
          }

          placeholder="Rechercher un produit, une catégorie, un pays..."

          style={{
            width:
              "100%",

            padding:
              "12px 16px 12px 40px",

            borderRadius:
              "14px",

            border:
              "1px solid #E4E2DC",

            fontSize:
              "14px",

            backgroundColor:
              "#fff",

            boxSizing:
              "border-box",

            outline:
              "none",
          }}
        />
      </div>


      {/* ===============================================
          FILTRES

          Pays et catégories viennent maintenant
          de reference_options en base.
      =============================================== */}

      <FilterBar
        fields={fields}
        filters={filters}
        onChange={setFilters}
      />


      {/* ===============================================
          NOMBRE ANNONCES + TRI
      =============================================== */}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          flexWrap:
            "wrap",

          gap: 12,

          marginBottom: 16,
        }}
      >
        <p
          style={{
            margin: 0,

            fontSize: 14,

            color:
              colors.textMuted,
          }}
        >
          {sortedItems.length}{" "}
          annonce
          {sortedItems.length >
          1
            ? "s"
            : ""}
        </p>


        <label
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap: 8,

            fontSize: 14,
          }}
        >
          Trier par

          <select
            value={sortBy}

            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }

            style={{
              padding:
                "8px 12px",

              borderRadius:
                8,

              border:
                "1px solid #E4E2DC",

              fontSize:
                14,

              backgroundColor:
                "#fff",
            }}
          >
            <option
              value="relevance"
            >
              Pertinence
            </option>

            <option
              value="price-asc"
            >
              Prix croissant
            </option>

            <option
              value="price-desc"
            >
              Prix décroissant
            </option>
          </select>
        </label>
      </div>


      {/* ===============================================
          LISTE DES ANNONCES
      =============================================== */}

      <AsyncState
        isLoading={
          isLoading
        }

        error={
          error
        }

        isEmpty={
          sortedItems.length ===
          0
        }

        emptyLabel="Aucune annonce ne correspond à ces filtres."
      >
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",

            gap: 20,
          }}
        >
          {paginatedItems.map(
            (listing) => (
              <ListingCard
                key={
                  listing.id
                }

                listing={
                  listing
                }
              />
            )
          )}
        </div>


        <Pagination
          currentPage={
            currentPage
          }

          totalPages={
            totalPages
          }

          onPageChange={
            setCurrentPage
          }
        />
      </AsyncState>
    </div>
  );
}