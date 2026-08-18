import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function MarketplaceView({ token, user }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('OFFRE');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formIncoterms, setFormIncoterms] = useState('');
  const [formDelivery, setFormDelivery] = useState('');
  
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    fetchAds();
    if (user && user.role !== 'admin') {
      fetchUserCompanies();
    }
  }, [filterType]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/ads/?status=ACTIVE`;
      if (filterType) url += `&type=${filterType}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAds(await res.json());
      } else {
        setError('Erreur lors du chargement des annonces');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        if (data.length > 0) setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAds();
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      alert("Veuillez sélectionner une entreprise");
      return;
    }
    
    const payload = {
      type: formType,
      title: formTitle,
      category: formCategory,
      description: formDesc,
      price: formPrice ? parseFloat(formPrice) : null,
      quantity: formQty || null,
      incoterms: formIncoterms || null,
      delivery_time: formDelivery || null
    };

    try {
      const res = await fetch(`${API_BASE}/ads/?company_id=${selectedCompanyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowForm(false);
        fetchAds();
      } else {
        const data = await res.json();
        alert(data.detail || "Erreur lors de la création");
      }
    } catch (err) {
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <div>
          <h2>Marketplace B2B Maroc</h2>
          <p>Découvrez les offres d'exportation et demandes d'achat de marchandises au Maroc.</p>
        </div>
        
        {user.role !== 'admin' && (
          <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : 'Publier une annonce'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmitAd} className="panel form-panel slide-down" style={{ marginTop: 16 }}>
          <h3>Nouvelle Annonce</h3>
          
          <div className="form-group">
            <label>Entreprise publiant l'annonce</label>
            <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} required>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.is_exporter ? 'Exportateur' : 'Importateur'})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value)} required>
                <option value="OFFRE">Offre de vente (Exportateur)</option>
                <option value="DEMANDE">Demande d'achat (Importateur)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <input type="text" placeholder="ex: Agroalimentaire, Textile..." value={formCategory} onChange={e => setFormCategory(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Titre de l'annonce</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Description détaillée</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} required rows="4"></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prix unitaire (MAD / DH) (Optionnel)</label>
              <input type="number" step="0.01" placeholder="ex: 4500" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Quantité (Optionnel)</label>
              <input type="text" placeholder="ex: 1000 Litres" value={formQty} onChange={e => setFormQty(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Incoterms (Optionnel)</label>
              <input type="text" placeholder="ex: FOB, CIF Casablanca" value={formIncoterms} onChange={e => setFormIncoterms(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Délai de livraison (Optionnel)</label>
              <input type="text" placeholder="ex: 15 jours" value={formDelivery} onChange={e => setFormDelivery(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="primary-btn">Publier l'annonce</button>
        </form>
      )}

      <div className="filters-bar" style={{ marginTop: 20 }}>
        <div className="filter-buttons">
          <button className={filterType === '' ? 'active' : ''} onClick={() => setFilterType('')}>Toutes les annonces</button>
          <button className={filterType === 'OFFRE' ? 'active' : ''} onClick={() => setFilterType('OFFRE')}>Offres</button>
          <button className={filterType === 'DEMANDE' ? 'active' : ''} onClick={() => setFilterType('DEMANDE')}>Demandes</button>
        </div>
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="Rechercher (titre, desc...)" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={16} />
          </button>
        </form>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>Chargement des annonces...</p>
      ) : error ? (
        <p className="error" style={{ marginTop: 16 }}>{error}</p>
      ) : (
        <div className="ads-grid" style={{ marginTop: 20 }}>
          {ads.length === 0 && <p>Aucune annonce disponible.</p>}
          {ads.map(ad => (
            <div key={ad.id} className={`ad-card ${ad.type.toLowerCase()}`}>
              <div className="ad-header">
                <span className="ad-badge">{ad.type}</span>
                <span className="ad-category">{ad.category}</span>
              </div>
              <h3>{ad.title}</h3>
              <p className="ad-desc">{ad.description.length > 100 ? ad.description.substring(0, 100) + '...' : ad.description}</p>
              
              <div className="ad-details">
                {ad.price && <p><strong>Prix:</strong> {ad.price} MAD (DH)</p>}
                {ad.quantity && <p><strong>Qté:</strong> {ad.quantity}</p>}
                {ad.incoterms && <p><strong>Incoterms:</strong> {ad.incoterms}</p>}
              </div>
              
              <div className="ad-footer">
                <small>{new Date(ad.created_at).toLocaleDateString('fr-FR')}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
