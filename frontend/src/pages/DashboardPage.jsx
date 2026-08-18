import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Globe, BarChart3, Store, Calendar, Building2, MessageSquare, ShoppingBag,
  Zap, Building, User, CheckCircle2, XCircle, ArrowLeft, PlusCircle
} from 'lucide-react';

import CompanyForm from '../CompanyForm.jsx';
import StandForm from '../StandForm.jsx';
import SalonForm from '../SalonForm.jsx';
import RendezVousForm from '../RendezVousForm.jsx';
import MessagingView from '../MessagingView.jsx';
import StandDetail from '../StandDetail.jsx';
import MarketplaceView from '../MarketplaceView.jsx';
import ExporterDashboard from '../ExporterDashboard.jsx';
import ImporterDashboard from '../ImporterDashboard.jsx';
import SalonHome from '../SalonHome.jsx';
import { API_BASE } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function getActiveTab(pathname) {
  if (pathname.startsWith('/messaging') || pathname.startsWith('/conversations')) {
    return 'messaging';
  }
  if (pathname.startsWith('/marketplace')) {
    return 'marketplace';
  }
  return 'dashboard';
}

export default function DashboardPage() {
  const { user, token, fetchWithAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId, standId: standIdParam } = useParams();
  
  const activeTab = getActiveTab(location.pathname);
  const selectedStandId = standIdParam || null;

  const [selectedRole, setSelectedRole] = useState(user.role_id || 'exporter');
  const [sidebarSection, setSidebarSection] = useState('overview');

  const [salons, setSalons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stands, setStands] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWithAuth(`${API_BASE}/salons`).then((res) => res.json()),
      fetchWithAuth(`${API_BASE}/companies`).then((res) => res.json()),
      fetchWithAuth(`${API_BASE}/rendez-vous`).then((res) => res.json()),
      fetchWithAuth(`${API_BASE}/stands`).then((res) => res.json()),
    ])
      .then(([salonsData, companiesData, rdvsData, standsData]) => {
        setSalons(salonsData || []);
        setCompanies(companiesData || []);
        setRdvs(rdvsData || []);
        setStands(standsData || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Session invalide') {
          setError('Impossible de charger les données');
        }
        setLoading(false);
      });
  }, [fetchWithAuth, token]);

  const handleCompanyCreated = (company) => setCompanies((cur) => [...cur, company]);
  const handleSalonCreated = (salon) => setSalons((cur) => [...cur, salon]);
  const handleStandCreated = (stand) => setStands((cur) => [...cur, stand]);
  const handleRdvCreated = (rdv) => setRdvs((cur) => [...cur, rdv]);

  async function updateCompanyStatus(companyId, newStatus) {
    const response = await fetchWithAuth(`${API_BASE}/companies/${companyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ profile_status: newStatus }),
    });
    if (!response.ok) {
      setError("Impossible de mettre à jour le statut de l'entreprise");
      return;
    }
    const updated = await response.json();
    setCompanies((cur) => cur.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function updateSalonStatus(salonId, newStatus) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/salons/${salonId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        setError('Impossible de mettre à jour le statut du salon');
        return;
      }
      const updated = await response.json();
      setSalons((cur) => cur.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      if (err.message !== 'Session invalide') {
        setError('Impossible de mettre à jour le statut du salon');
      }
    }
  }

  async function updateStandStatus(standId, action) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/stands/${standId}/${action}`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        setError('Impossible de mettre à jour le statut du stand');
        return;
      }
      const updated = await response.json();
      setStands((cur) => cur.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      if (err.message !== 'Session invalide') {
        setError('Impossible de mettre à jour le statut du stand');
      }
    }
  }

  async function handlePayStand(standId) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/payments/stands/${standId}/checkout`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || "Erreur d'initialisation du paiement");
      }
    } catch {
      setError('Erreur de réseau pour le paiement');
    }
  }

  async function updateRdvStatus(rdvId, action) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/rendez-vous/${rdvId}/${action}`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        setError('Impossible de mettre à jour le rendez-vous');
        return;
      }
      const updated = await response.json();
      setRdvs((cur) => cur.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      if (err.message !== 'Session invalide') {
        setError('Impossible de mettre à jour le rendez-vous');
      }
    }
  }

  async function updateRdvAlternative(rdvId, datetimes) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/rendez-vous/${rdvId}/alternative`, {
        method: 'PATCH',
        body: JSON.stringify({ alternative_datetimes: datetimes }),
      });
      if (!response.ok) {
        setError('Impossible de proposer un créneau');
        return;
      }
      const updated = await response.json();
      setRdvs((cur) => cur.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      if (err.message !== 'Session invalide') {
        setError('Impossible de proposer un créneau');
      }
    }
  }

  const isAdmin = user.role_id === 'admin';
  const effectiveRole = isAdmin ? selectedRole : user.role_id;

  const goBackFromStand = () => {
    if (selectedSalon) {
      navigate('/dashboard');
      return;
    }
    navigate(activeTab === 'dashboard' ? '/dashboard' : `/${activeTab}`);
  };

  if (loading) {
    return <section className="panel">Chargement des données de la plateforme...</section>;
  }

  return (
    <div className="dashboard-with-sidebar">
      {/* ─────────────────────────────────────────────────────────────
         BARRE DE MENU LATÉRALE À GAUCHE (SIDEBAR)
         ───────────────────────────────────────────────────────────── */}
      <aside className="left-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Globe className="icon-blue" size={28} />
          </div>
          <div>
            <h3>SalonVirtuel</h3>
            <span className="role-tag">{effectiveRole.toUpperCase()}</span>
          </div>
        </div>

        {/* Sélecteur de rôle pour Administrateur */}
        {isAdmin && (
          <div className="admin-role-switcher">
            <span className="switcher-label">Aperçu par rôle :</span>
            <div className="switcher-buttons">
              <button
                type="button"
                className={`switcher-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('admin'); setSidebarSection('admin_overview'); }}
              >
                Admin
              </button>
              <button
                type="button"
                className={`switcher-btn ${selectedRole === 'exporter' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('exporter'); setSidebarSection('overview'); }}
              >
                Exportateur
              </button>
              <button
                type="button"
                className={`switcher-btn ${selectedRole === 'importer' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('importer'); setSidebarSection('salons'); }}
              >
                Importateur
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sidebar Exportateur */}
        {effectiveRole === 'exporter' && (
          <nav className="sidebar-nav">
            <div className="nav-group-title">ESPACE EXPORTATEUR</div>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'overview' ? 'active' : ''}`}
              onClick={() => setSidebarSection('overview')}
            >
              <BarChart3 size={18} /> <span>Analytics & Performance</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'stands' ? 'active' : ''}`}
              onClick={() => setSidebarSection('stands')}
            >
              <Store size={18} /> <span>Mes Stands & Salons</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'rdvs' ? 'active' : ''}`}
              onClick={() => setSidebarSection('rdvs')}
            >
              <Calendar size={18} /> <span>Mes Rendez-vous</span>
              {rdvs.length > 0 && <span className="badge">{rdvs.length}</span>}
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'companies' ? 'active' : ''}`}
              onClick={() => setSidebarSection('companies')}
            >
              <Building2 size={18} /> <span>Mes Entreprises</span>
            </button>

            <div className="nav-group-title" style={{ marginTop: 20 }}>COMMUNICATION</div>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate('/messaging')}
            >
              <MessageSquare size={18} /> <span>Messagerie Directe</span>
            </button>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag size={18} /> <span>Marketplace Annonces</span>
            </button>
          </nav>
        )}

        {/* Navigation Sidebar Importateur */}
        {effectiveRole === 'importer' && (
          <nav className="sidebar-nav">
            <div className="nav-group-title">ESPACE IMPORTATEUR</div>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'salons' ? 'active' : ''}`}
              onClick={() => setSidebarSection('salons')}
            >
              <Globe size={18} /> <span>Salons Virtuels</span>
              <span className="badge">{salons.filter((s) => s.status === 'VALIDE').length}</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'stands' ? 'active' : ''}`}
              onClick={() => setSidebarSection('stands')}
            >
              <Store size={18} /> <span>Stands & Exposants</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'rdvs' ? 'active' : ''}`}
              onClick={() => setSidebarSection('rdvs')}
            >
              <Calendar size={18} /> <span>Mes Rendez-vous</span>
              {rdvs.length > 0 && <span className="badge">{rdvs.length}</span>}
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'company' ? 'active' : ''}`}
              onClick={() => setSidebarSection('company')}
            >
              <Building size={18} /> <span>Profil Société</span>
            </button>

            <div className="nav-group-title" style={{ marginTop: 20 }}>COMMUNICATION</div>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate('/messaging')}
            >
              <MessageSquare size={18} /> <span>Messagerie</span>
            </button>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag size={18} /> <span>Marketplace</span>
            </button>
          </nav>
        )}

        {/* Navigation Sidebar Administrateur */}
        {effectiveRole === 'admin' && (
          <nav className="sidebar-nav">
            <div className="nav-group-title">ADMINISTRATION</div>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'admin_overview' ? 'active' : ''}`}
              onClick={() => setSidebarSection('admin_overview')}
            >
              <Zap size={18} /> <span>Vue d'ensemble</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'admin_salons' ? 'active' : ''}`}
              onClick={() => setSidebarSection('admin_salons')}
            >
              <Building2 size={18} /> <span>Gestion des Salons</span>
              <span className="badge">{salons.length}</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'admin_companies' ? 'active' : ''}`}
              onClick={() => setSidebarSection('admin_companies')}
            >
              <Building size={18} /> <span>Validation Entreprises</span>
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'admin_stands' ? 'active' : ''}`}
              onClick={() => setSidebarSection('admin_stands')}
            >
              <Store size={18} /> <span>Demandes de Stands</span>
              {stands.filter((s) => s.status === 'EN_ATTENTE_VALIDATION').length > 0 && (
                <span className="badge warning">{stands.filter((s) => s.status === 'EN_ATTENTE_VALIDATION').length}</span>
              )}
            </button>
            <button
              type="button"
              className={`sidebar-link ${sidebarSection === 'admin_rdvs' ? 'active' : ''}`}
              onClick={() => setSidebarSection('admin_rdvs')}
            >
              <Calendar size={18} /> <span>Supervision RDV</span>
            </button>

            <div className="nav-group-title" style={{ marginTop: 20 }}>AUTRES MODULES</div>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag size={18} /> <span>Marketplace</span>
            </button>
          </nav>
        )}

        {/* Bas de sidebar : Profil Utilisateur */}
        <div className="sidebar-footer">
          <div className="user-info-mini">
            <div className="user-avatar-circle">
              <User size={18} />
            </div>
            <div className="user-details">
              <strong>{user.full_name || 'Utilisateur'}</strong>
              <small>{user.email}</small>
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
         ZONE PRINCIPALE DE CONTENU DYNAMIQUE
         ───────────────────────────────────────────────────────────── */}
      <main className="dashboard-content-area">
        {error && (
          <div className="panel error-panel" style={{ marginBottom: 16 }}>
            <p className="error">{error}</p>
          </div>
        )}

        {/* Messagerie */}
        {activeTab === 'messaging' && (
          <MessagingView
            token={token}
            user={user}
            salons={salons}
            initialConversationId={conversationId}
          />
        )}

        {/* Marketplace */}
        {activeTab === 'marketplace' && <MarketplaceView token={token} user={user} />}

        {/* Vue Stand Détaillé */}
        {selectedStandId && (
          <StandDetail
            standId={selectedStandId}
            token={token}
            user={user}
            onBack={goBackFromStand}
          />
        )}

        {/* Salle Virtuelle de Salon */}
        {selectedSalon && !selectedStandId && (
          <div className="panel">
            <button
              type="button"
              onClick={() => setSelectedSalon(null)}
              className="secondary-btn small"
              style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> Retour au Dashboard
            </button>
            <SalonHome
              salon={selectedSalon}
              token={token}
              user={user}
              onSelectStand={(standId) => navigate(`/stands/${standId}`)}
            />
          </div>
        )}

        {/* DASHBOARD PRINCIPAL PAR RÔLE */}
        {activeTab === 'dashboard' && !selectedStandId && !selectedSalon && (
          <>
            {/* VUE EXPORTATEUR */}
            {effectiveRole === 'exporter' && (
              <ExporterDashboard
                token={token}
                user={user}
                stands={stands}
                rdvs={rdvs}
                salons={salons}
                companies={companies}
                activeSection={sidebarSection}
                onConfirmRdv={(id) => updateRdvStatus(id, 'confirm')}
                onRefuseRdv={(id) => updateRdvStatus(id, 'refuse')}
                onCompleteRdv={(id) => updateRdvStatus(id, 'complete')}
                onAlternativeRdv={updateRdvAlternative}
                onPayStand={handlePayStand}
                onViewStand={(id) => navigate(`/stands/${id}`)}
                onCompanyCreated={handleCompanyCreated}
                onSalonCreated={handleSalonCreated}
                onStandCreated={handleStandCreated}
              />
            )}

            {/* VUE IMPORTATEUR */}
            {effectiveRole === 'importer' && (
              <ImporterDashboard
                token={token}
                user={user}
                salons={salons}
                stands={stands}
                rdvs={rdvs}
                companies={companies}
                activeSection={sidebarSection}
                onSelectSalon={(s) => setSelectedSalon(s)}
                onVisitStand={(id) => navigate(`/stands/${id}`)}
                onConfirmRdv={(id) => updateRdvStatus(id, 'confirm')}
                onRefuseRdv={(id) => updateRdvStatus(id, 'refuse')}
                onCompanyCreated={handleCompanyCreated}
                onRdvCreated={handleRdvCreated}
              />
            )}

            {/* VUE ADMINISTRATEUR */}
            {effectiveRole === 'admin' && (
              <div className="admin-dashboard">
                <div className="analytics-header">
                  <h2>Panneau d'Administration</h2>
                  <p>Supervision globale de la plateforme, gestion des salons, validation des profils et modération.</p>
                </div>

                {/* KPI ADMIN OVERVIEW */}
                {(sidebarSection === 'admin_overview' || sidebarSection === 'overview') && (
                  <>
                    <div className="kpi-grid" style={{ marginBottom: 20 }}>
                      <div className="kpi-card">
                        <span className="kpi-title">Salons</span>
                        <strong className="kpi-value">{salons.length}</strong>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Entreprises</span>
                        <strong className="kpi-value">{companies.length}</strong>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Demandes de Stands</span>
                        <strong className="kpi-value">{stands.length}</strong>
                      </div>
                      <div className="kpi-card">
                        <span className="kpi-title">Rendez-vous</span>
                        <strong className="kpi-value">{rdvs.length}</strong>
                      </div>
                    </div>

                    <div className="panel">
                      <h3>Points d’attention administrateur</h3>
                      <ul className="task-list">
                        <li>Salons à publier : <strong>{salons.filter((s) => s.status !== 'VALIDE').length}</strong></li>
                        <li>Entreprises à valider : <strong>{companies.filter((c) => c.profile_status !== 'VALIDE').length}</strong></li>
                        <li>Demandes de stands en attente : <strong>{stands.filter((s) => s.status === 'EN_ATTENTE_VALIDATION').length}</strong></li>
                        <li>Rendez-vous actifs : <strong>{rdvs.filter((r) => r.status !== 'TERMINE').length}</strong></li>
                      </ul>
                    </div>
                  </>
                )}

                {/* MODÉRATION STANDS */}
                {(sidebarSection === 'admin_overview' || sidebarSection === 'admin_stands') && (
                  <div className="panel" style={{ marginTop: 20 }}>
                    <h3>Validation des demandes de stands</h3>
                    {stands.filter((s) => s.status === 'EN_ATTENTE_VALIDATION').length === 0 ? (
                      <p>Aucune demande de stand en attente pour le moment.</p>
                    ) : (
                      <div className="item-list">
                        {stands.filter((s) => s.status === 'EN_ATTENTE_VALIDATION').map((stand) => (
                          <article key={stand.id} className="item-row">
                            <div>
                              <strong>{stand.company_name}</strong>
                              <p>Salon : {stand.salon_id} • Statut : {stand.status}</p>
                            </div>
                            <div className="row-actions">
                              <button onClick={() => updateStandStatus(stand.id, 'validate')} className="primary-btn small">Valider</button>
                              <button onClick={() => updateStandStatus(stand.id, 'reject')} className="secondary-btn small">Rejeter</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CRÉATION & GESTION SALONS */}
                {(sidebarSection === 'admin_overview' || sidebarSection === 'admin_salons') && (
                  <>
                    <div className="panel" style={{ marginTop: 20 }}>
                      <h3>Création d'un Salon Virtuel</h3>
                      <SalonForm onCreated={handleSalonCreated} token={token} />
                    </div>

                    <div className="panel" style={{ marginTop: 20 }}>
                      <h3>Gestion & Publication des Salons</h3>
                      {salons.length === 0 ? (
                        <p>Aucun salon enregistré.</p>
                      ) : (
                        <div className="item-list">
                          {salons.map((salon) => (
                            <article key={salon.id} className="item-row">
                              <div>
                                <strong>{salon.title}</strong> {salon.theme && <span className="tag-pill">{salon.theme}</span>}
                                <p>Statut : <strong>{salon.status}</strong> • Prix stand : {salon.stand_price ? `${salon.stand_price} MAD (DH)` : 'Gratuit'}</p>
                              </div>
                              <div className="row-actions">
                                {salon.status !== 'VALIDE' ? (
                                  <button onClick={() => updateSalonStatus(salon.id, 'VALIDE')} className="primary-btn small">Publier</button>
                                ) : (
                                  <button onClick={() => updateSalonStatus(salon.id, 'CLOTURE')} className="secondary-btn small">Clôturer</button>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* VALIDATION ENTREPRISES */}
                {(sidebarSection === 'admin_overview' || sidebarSection === 'admin_companies') && (
                  <div className="panel" style={{ marginTop: 20 }}>
                    <h3>Validation des Entreprises</h3>
                    {companies.length === 0 ? (
                      <p>Aucune entreprise enregistrée.</p>
                    ) : (
                      <div className="item-list">
                        {companies.map((comp) => (
                          <article key={comp.id} className="item-row">
                            <div>
                              <strong>{comp.name}</strong>
                              <p>Pays : {comp.country || 'N/C'} • Statut : {comp.profile_status}</p>
                            </div>
                            {comp.profile_status !== 'VALIDE' && (
                              <button onClick={() => updateCompanyStatus(comp.id, 'VALIDE')} className="primary-btn small">
                                Valider Profil
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
