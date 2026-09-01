import { useState } from 'react';
import {
  Globe, Search, Calendar, Store, ArrowRight, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import CompanyForm from './CompanyForm.jsx';
import RendezVousForm from './RendezVousForm.jsx';

function StatusBadge({ status }) {
  const map = {
    PROPOSE: { label: 'DEMANDÉ', tone: 'pending' },
    ALTERNATIVE_PROPOSEE: { label: 'CRÉNEAU PROPOSÉ', tone: 'info' },
    CONFIRME: { label: 'CONFIRMÉ', tone: 'success' },
    TERMINE: { label: 'TERMINÉ', tone: 'success' },
    REFUSE: { label: 'REFUSÉ', tone: 'error' },
  };
  const conf = map[status] || { label: status, tone: 'info' };
  return <span className={`status-badge ${conf.tone}`}>{conf.label}</span>;
}

export default function ImporterDashboard({
  token,
  user,
  salons = [],
  stands = [],
  rdvs = [],
  companies = [],
  activeSection = 'salons',
  onSelectSalon,
  onVisitStand,
  onConfirmRdv,
  onRefuseRdv,
  onCompanyCreated,
  onRdvCreated,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ALL');
  const [publishedOnly, setPublishedOnly] = useState(true);

  const ownedCompanies = companies.filter((c) => c.owner_id === user.id);
  const validatedStands = stands.filter((s) => s.status === 'VALIDE');

  const themes = ['ALL', ...new Set(salons.map((s) => s.theme).filter(Boolean))];

  const visibleSalons = salons.filter((s) => {
    if (publishedOnly && s.status !== 'VALIDE') return false;
    if (selectedTheme !== 'ALL' && s.theme !== selectedTheme) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.theme?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSalonTitle = (salonId) => {
    const salon = salons.find((s) => s.id === salonId);
    return salon ? salon.title : salonId;
  };

  const getCompanyName = (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : companyId;
  };

  const myRdvs = rdvs.filter((r) => r.importer_id === user.id || ownedCompanies.some((c) => c.id === r.importer_id));

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR');
  };

  return (
    <div className="importer-dashboard">
      {/* ─── EN-TÊTE SECTION ─────────────────────────────────────────── */}
      <div className="analytics-header">
        <h2>Dashboard Importateur</h2>
        <p>Explorez les salons virtuels, visitez les stands exposants et gérez vos rendez-vous d'affaires.</p>
      </div>

      {/* ─── SECTION 1: SALONS VIRTUELS ─────────────────────────────── */}
      {activeSection === 'salons' && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-header-with-actions">
              <div>
                <h3>Salons Virtuels Ouverts</h3>
                <p className="subtitle">Découvrez les opportunités d'exportation et visitez les halls d'exposition.</p>
              </div>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setPublishedOnly(!publishedOnly)}
              >
                {publishedOnly ? 'Afficher tous les salons' : 'Voir uniquement les salons publiés'}
              </button>
            </div>

            {/* Filtres de recherche */}
            <div className="filter-controls" style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <div style={{ flex: 2, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Rechercher un salon par nom, produit ou secteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36 }}
                />
                <Search size={16} style={{ position: 'absolute', left: 12, top: 18, color: '#94a3b8' }} />
              </div>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                style={{ flex: 1 }}
              >
                {themes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'ALL' ? 'Tous les secteurs' : t}
                  </option>
                ))}
              </select>
            </div>

            {visibleSalons.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                <p>Aucun salon virtuel disponible avec ces critères.</p>
              </div>
            ) : (
              <div className="salons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
                {visibleSalons.map((salon) => {
                  const salonStands = stands.filter((s) => s.salon_id === salon.id && s.status === 'VALIDE');
                  return (
                    <div key={salon.id} className="salon-card-pro">
                      <div className="salon-card-badge">{salon.theme || 'Général'}</div>
                      <h4>{salon.title}</h4>
                      <p className="salon-desc">{salon.description || 'Aucune description disponible'}</p>
                      <div className="salon-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} /> Du {salon.start_date || 'N/C'} au {salon.end_date || 'N/C'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Store size={14} /> {salonStands.length} stand(s) exposé(s)
                        </span>
                      </div>
                      <div className="salon-card-footer">
                        <button
                          type="button"
                          className="primary-btn full-width"
                          onClick={() => onSelectSalon(salon)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <span>Entrer dans le salon</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 2: ANNUAIRE DES STANDS & EXPOSANTS ──────────────── */}
      {activeSection === 'stands' && (
        <div className="panel-section">
          <div className="panel">
            <h3>Stands & Exposants Validés</h3>
            <p className="subtitle">Parcourez les stands validés des exportateurs certifiés.</p>

            {validatedStands.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                <p>Aucun stand validé pour le moment.</p>
              </div>
            ) : (
              <div className="item-list" style={{ marginTop: 16 }}>
                {validatedStands.map((stand) => (
                  <article key={stand.id} className="item-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{stand.company_name}</strong>
                        <span className="tag-pill">{getSalonTitle(stand.salon_id)}</span>
                      </div>
                      <p>Salon : <strong>{getSalonTitle(stand.salon_id)}</strong></p>
                      {stand.description && <p style={{ fontSize: '0.88rem', color: '#64748b' }}>{stand.description}</p>}
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => onVisitStand(stand.id)}
                        className="secondary-btn small"
                      >
                        Visiter le stand
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: RENDEZ-VOUS ──────────────────────────────────── */}
      {activeSection === 'rdvs' && (
        <div className="panel-section">
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <div className="kpi-card">
              <span className="kpi-title">RDV Total</span>
              <strong className="kpi-value">{myRdvs.length}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">RDV Confirmés</span>
              <strong className="kpi-value">{myRdvs.filter((r) => r.status === 'CONFIRME').length}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Créneaux à valider</span>
              <strong className="kpi-value">{myRdvs.filter((r) => r.status === 'ALTERNATIVE_PROPOSEE').length}</strong>
            </div>
          </div>

          <div className="panel">
            <h3>Mes rendez-vous d'affaires</h3>
            <p className="subtitle">Suivez l'état de vos demandes et validez les propositions d'horaires.</p>

            {myRdvs.length === 0 ? (
              <p style={{ marginTop: 12 }}>Aucun rendez-vous planifié pour le moment.</p>
            ) : (
              <div className="item-list" style={{ marginTop: 16 }}>
                {myRdvs.map((rdv) => (
                  <article key={rdv.id} className="item-row rdv-row">
                    <div>
                      <strong>Rendez-vous #{rdv.id.substring(0, 8)}</strong>
                      <p>Salon : <strong>{getSalonTitle(rdv.salon_id)}</strong></p>
                      <p>Exportateur : <strong>{getCompanyName(rdv.exporter_id)}</strong> • Statut : <StatusBadge status={rdv.status} /></p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} /> Date proposée : <strong>{formatDate(rdv.proposed_datetime)}</strong>
                      </p>

                      {rdv.status === 'ALTERNATIVE_PROPOSEE' && rdv.alternative_datetimes?.length > 0 && (
                        <div className="alt-proposal-box" style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginTop: 8 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={16} /> L'exportateur vous propose de nouveaux créneaux :
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            {rdv.alternative_datetimes.map((dt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="primary-btn small"
                                onClick={() => onConfirmRdv(rdv.id)}
                              >
                                Acccepter {formatDate(dt)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="row-actions">
                      {rdv.status === 'PROPOSE' && (
                        <button type="button" onClick={() => onRefuseRdv(rdv.id)} className="secondary-btn small">
                          Annuler
                        </button>
                      )}
                      {rdv.status === 'ALTERNATIVE_PROPOSEE' && (
                        <button type="button" onClick={() => onConfirmRdv(rdv.id)} className="primary-btn small">
                          Confirmer
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Proposer un nouveau rendez-vous</h3>
            <RendezVousForm
              salons={salons}
              companies={companies}
              onCreated={onRdvCreated}
              token={token}
              user={user}
            />
          </div>
        </div>
      )}

      {/* ─── SECTION 4: MON ENTREPRISE IMPORTATRICE ─────────────────── */}
      {activeSection === 'company' && (
        <div className="panel-section">
          <div className="panel">
            <h3>Fiche Entreprise Importatrice</h3>
            {ownedCompanies.length === 0 ? (
              <p>Vous n'avez pas encore configuré votre profil d'entreprise importatrice.</p>
            ) : (
              <div className="item-list" style={{ marginTop: 12 }}>
                {ownedCompanies.map((comp) => (
                  <article key={comp.id} className="item-row">
                    <div>
                      <strong>{comp.name}</strong>
                      <p>Pays : {comp.country || 'N/C'} • Secteur : {comp.sector || 'N/C'}</p>
                      <p>Statut profil : <span className="status-badge success">{comp.profile_status || 'VALIDE'}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Ajouter ou Mettre à jour une Société Importatrice</h3>
            <CompanyForm onCreated={onCompanyCreated} token={token} />
          </div>
        </div>
      )}
    </div>
  );
}
