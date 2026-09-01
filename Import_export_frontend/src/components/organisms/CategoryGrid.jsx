import { useEffect, useMemo, useState } from "react";
import {
  Wheat,
  Zap,
  Shirt,
  Cpu,
  Car,
  FlaskConical,
  Building2,
  Cog,
  Package,
  Grid2X2,
} from "lucide-react";

import CategoryCard from "./CategoryCard";

import { spacing } from "../../styles/tokens";

import { useResourceList } from "../../hooks/useResourceList";

import {
  getMyListings,
} from "../../api/listings";

import {
  getReferenceOptions,
} from "../../api/referenceOptions";

import {
  useAuth,
} from "../../context/AuthContext";


/* =========================================================
   ICÔNES POUR LES CATÉGORIES CONNUES
========================================================= */

const ICONS_BY_CATEGORY = {
  Agroalimentaire: Wheat,
  Énergie: Zap,
  Textile: Shirt,
  Électronique: Cpu,
  Automobile: Car,
  Cosmétique: FlaskConical,
  Construction: Building2,
  "Machines industrielles": Cog,
  "Emballage & Logistique": Package,
};


/* =========================================================
   NOMBRE DE CATÉGORIES À METTRE EN AVANT
========================================================= */

const HIGHLIGHT_COUNT = 2;


/* =========================================================
   COMPONENT
========================================================= */

export default function CategoryGrid() {
  const { user } = useAuth();


  /* =======================================================
     MES ANNONCES

     Elles servent uniquement à calculer :
     - le nombre d'annonces par catégorie
     - les catégories les plus utilisées
  ======================================================= */

  const {
    items: listings,
  } = useResourceList(
    user
      ? getMyListings
      : null
  );


  /* =======================================================
     CATÉGORIES DYNAMIQUES DEPUIS POSTGRESQL
  ======================================================= */

  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] = useState(true);


  const [
    categoriesError,
    setCategoriesError,
  ] = useState(null);


  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setIsLoadingCategories(
          true
        );

        setCategoriesError(
          null
        );


        const data =
          await getReferenceOptions(
            "category"
          );


        if (cancelled) {
          return;
        }


        const normalized =
          (
            Array.isArray(data)
              ? data
              : []
          ).map(
            (item) => {
              const label =
                item.label ||
                item.value;

              return {
                id:
                  item.id,

                label,

                category:
                  item.value,

                /*
                 * Si la catégorie est connue,
                 * on utilise son icône.
                 *
                 * Sinon :
                 * icône générique.
                 */
                Icon:
                  ICONS_BY_CATEGORY[
                    label
                  ] ||
                  Grid2X2,
              };
            }
          );


        setCategories(
          normalized
        );

      } catch (error) {
        console.error(
          "Erreur chargement catégories :",
          error
        );

        if (!cancelled) {
          setCategoriesError(
            "Impossible de charger les catégories."
          );
        }

      } finally {
        if (!cancelled) {
          setIsLoadingCategories(
            false
          );
        }
      }
    }


    loadCategories();


    return () => {
      cancelled = true;
    };
  }, []);


  /* =======================================================
     NOMBRE D'ANNONCES PAR CATÉGORIE
  ======================================================= */

  const listingCountByCategory =
    useMemo(() => {
      const counts = {};

      for (
        const listing
        of listings
      ) {
        if (
          !listing.category
        ) {
          continue;
        }


        counts[
          listing.category
        ] =
          (
            counts[
              listing.category
            ] ||
            0
          ) + 1;
      }


      return counts;

    }, [
      listings,
    ]);


  /* =======================================================
     TOP CATÉGORIES

     Les catégories les plus utilisées par
     l'utilisateur connecté seront affichées
     plus grandes.
  ======================================================= */

  const topCategories =
    useMemo(() => {
      if (
        !user ||
        listings.length === 0
      ) {
        return [];
      }


      return Object.entries(
        listingCountByCategory
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(
          0,
          HIGHLIGHT_COUNT
        )
        .map(
          ([category]) =>
            category
        );

    }, [
      user,
      listings,
      listingCountByCategory,
    ]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    isLoadingCategories
  ) {
    return (
      <div
        style={{
          padding: "30px 0",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Chargement des secteurs...
      </div>
    );
  }


  /* =======================================================
     ERREUR
  ======================================================= */

  if (
    categoriesError
  ) {
    return (
      <div
        style={{
          padding: "20px",
          borderRadius: 12,
          background:
            "#fff7ed",
          color:
            "#9a3412",
          fontSize: 14,
        }}
      >
        ⚠️ {categoriesError}
      </div>
    );
  }


  /* =======================================================
     AUCUNE CATÉGORIE
  ======================================================= */

  if (
    categories.length === 0
  ) {
    return (
      <div
        style={{
          padding: "30px 0",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Aucun secteur disponible.
      </div>
    );
  }


  /* =======================================================
     GRID
  ======================================================= */

  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "repeat(auto-fit, minmax(160px, 1fr))",

        gridAutoRows:
          "minmax(120px, auto)",

        gap:
          spacing.md,
      }}
    >
      {categories.map(
        (cat) => {
          const big =
            topCategories.includes(
              cat.category
            );


          const count =
            listingCountByCategory[
              cat.category
            ] ||
            0;


          return (
            <div
              key={
                cat.id ||
                cat.category
              }

              style={{
                gridColumn:
                  big
                    ? "span 2"
                    : "span 1",
              }}
            >
              <CategoryCard
                label={
                  cat.label
                }

                category={
                  cat.category
                }

                Icon={
                  cat.Icon
                }

                big={
                  big
                }

                count={
                  count
                }
              />
            </div>
          );
        }
      )}
    </div>
  );
}