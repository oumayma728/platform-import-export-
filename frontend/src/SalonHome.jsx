import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function SalonHome({ salon, token, onSelectStand, user }) {
  const [stands, setStands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (salon?.id) {
      fetchSalonStands();
    }
  }, [salon, selectedCategory, searchQuery]);

  const fetchSalonStands = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/salons/${salon.id}/stands`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        let data = await res.json();
        // Ne garder que les stands validés
        let validated = data.filter((s) => s.status === 'VALIDE');

        // Extraire les catégories uniques
        const cats = Array.from(new Set(validated.map((s) => s.company?.category || s.products).filter(Boolean)));
        setCategories(cats);

        // Filtrage côté client si besoin (catégorie et nom d'exportateur)
        if (selectedCategory) {
          validated = validated.filter(
            (s) =>
              (s.company?.category && s.company.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
              (s.products && s.products.toLowerCase().includes(selectedCategory.toLowerCase()))
          );
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          validated = validated.filter(
            (s) =>
              s.company_name.toLowerCase().includes(q) ||
              (s.company?.country && s.company.country.toLowerCase().includes(q)) ||
              (s.products && s.products.toLowerCase().includes(q))
          );
        }

        setStands(validated);
      } else {
        setError('Erreur lors du chargement des stands');
      }
    } catch (err) {
      setError('Erreur de connexion serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="salon-home-shell">
      {/* 1. Bannière thématique & En-tête du salon */}
      <section className="salon-hero-banner">
        <div className="banner-content">
          <span className="badge-theme">{salon.theme || salon.category || 'Salon International'}</span>
          <h1>{salon.title}</h1>
          <p className="salon-desc">{salon.description || 'Découvrez les opportunités d’import-export et visitez les stands des entreprises certifiées.'}</p>
          
          <div className="salon-meta-bar">
            <span>📅 <strong>Dates :</strong> {salon.start_date || 'N/C'} au {salon.end_date || 'N/C'}</span>
            <span>🏪 <strong>Stands Exposants :</strong> {stands.length} validé(s)</span>
          </div>
        </div>
      </section>

      {/* 2. Barre de recherche & Filtres par catégorie */}
      <section className="salon-filter-section panel">
        <div className="filter-grid">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Rechercher un exportateur, un pays ou un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-box">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Toutes les catégories de produits</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat.length > 30 ? cat.substring(0, 30) + '...' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 3. Grille des cartes de stands validés */}
      <section className="stands-grid-section">
        <h3>Exposants & Stands virtuels</h3>

        {loading && <p>Chargement des stands en cours...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && stands.length === 0 && (
          <div className="panel empty-state">
            <p>Aucun stand ne correspond à vos critères de recherche.</p>
          </div>
        )}

        <div className="stands-cards-grid">
          {stands.map((stand) => (
            <article key={stand.id} className="stand-card">
              <div className="card-header">
                <div className="company-logo-placeholder">
                  {stand.company_name ? stand.company_name.charAt(0).toUpperCase() : '🏢'}
                </div>
                <div>
                  <h4>{stand.company_name}</h4>
                  <span className="country-tag">🌍 {stand.company?.country || 'Exportateur certifié'}</span>
                </div>
              </div>

              <div className="card-body">
                <p className="product-summary">
                  <strong>Produits :</strong> {stand.products || 'Produits de qualité internationale'}
                </p>
                {stand.certifications && (
                  <p className="certif-badge">🏷️ {stand.certifications}</p>
                )}

                {/* Aperçu vidéo si disponible */}
                {stand.video_url ? (
                  <div className="video-preview-thumbnail">
                    <span className="play-icon">▶ Aperçu vidéo de présentation</span>
                  </div>
                ) : (
                  <div className="video-placeholder">📹 Présentation vidéo disponible sur le stand</div>
                )}
              </div>

              <div className="card-footer">
                <button onClick={() => onSelectStand(stand.id)} className="primary-btn full-width">
                  Visiter le stand & Contacter ➔
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
