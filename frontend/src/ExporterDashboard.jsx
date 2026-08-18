import { useState, useEffect } from 'react';
import {
  Calendar, Building2, Store, CreditCard, Eye, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import CompanyForm from './CompanyForm.jsx';
import StandForm from './StandForm.jsx';
import SalonForm from './SalonForm.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function standDisplayStatus(stand) {
  if (stand.status === 'REJETE') return { label: 'REJETE', tone: 'error' };
  if (stand.status === 'VALIDE' && stand.payment_status === 'PAID') return { label: 'VALIDE', tone: 'success' };
  if (stand.status === 'VALIDE' && stand.payment_status === 'PENDING') return { label: 'EN_ATTENTE_PAIEMENT', tone: 'pending' };
  if (stand.status === 'VALIDE' && stand.payment_status === 'FAILED') return { label: 'PAIEMENT_ECHOUE', tone: 'error' };
  return { label: 'EN_ATTENTE_VALIDATION', tone: 'info' };
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.tone}`}>{status.label}</span>;
}

export default function ExporterDashboard({
  token, user, stands = [], rdvs = [], salons = [], companies = [],
  activeSection = 'overview',
  onConfirmRdv, onRefuseRdv, onCompleteRdv, onAlternativeRdv, onPayStand, onViewStand,
  onCompanyCreated, onSalonCreated, onStandCreated,
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [altOpen, setAltOpen] = useState({});
  const [altValue, setAltValue] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats/exporter`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError("Erreur lors de la récupération des statistiques.");
        }
      } catch (err) {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const ownedCompanyIds = companies.filter((c) => c.owner_id === user.id).map((c) => c.id);
  const ownedCompanies = companies.filter((c) => c.owner_id === user.id);
  const myStands = stands.filter((s) => ownedCompanyIds.includes(s.exporter_id));
  const myRdvs = rdvs.filter((r) => ownedCompanyIds.includes(r.exporter_id));

  const getSalonTitle = (salonId) => {
    const salon = salons.find((s) => s.id === salonId);
    return salon ? salon.title : salonId;
  };

  const getSalonEndDate = (salonId) => {
    const salon = salons.find((s) => s.id === salonId);
    return salon?.end_date || '—';
  };

  const getCompanyName = (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : companyId;
  };

  const standVisitors = (stand) => {
    const rdvsForStand = myRdvs.filter((r) => r.stand_id === stand.id);
    return 20 + rdvsForStand.length * 8;
  };
  const totalVisitors = myStands.reduce((sum, s) => sum + standVisitors(s), 0);

  const rdvDemandes = myRdvs.filter((r) => r.status === 'PROPOSE' || r.status === 'ALTERNATIVE_PROPOSEE').length;
  const rdvConfirme = myRdvs.filter((r) => r.status === 'CONFIRME').length;
  const rdvTermine = myRdvs.filter((r) => r.status === 'TERMINE').length;

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR');
  };

  const toggleAlt = (rdvId) => setAltOpen((cur) => ({ ...cur, [rdvId]: !cur[rdvId] }));
  const submitAlt = (rdvId) => {
    const dts = (altValue[rdvId] || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    if (dts.length === 0) return;
    onAlternativeRdv(rdvId, dts);
    setAltOpen((cur) => ({ ...cur, [rdvId]: false }));
    setAltValue((cur) => ({ ...cur, [rdvId]: '' }));
  };

  if (loading) return <div className="panel">Chargement des statistiques exportateur...</div>;

  return (
    <div className="dashboard-analytics">
      <div className="analytics-header">
        <h2>Dashboard Exportateur</h2>
        <p>Gérez votre présence sur les salons, vos candidatures de stands et vos rendez-vous clients.</p>
      </div>

      {/* ─── KPIS RECAPITULATIFS ────────────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <span className="kpi-title">Stands Actifs</span>
          <strong className="kpi-value">{myStands.length}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Visiteurs (est.)</span>
          <strong className="kpi-value">{totalVisitors}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">RDV Demandés</span>
          <strong className="kpi-value">{rdvDemandes}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">RDV Confirmés</span>
          <strong className="kpi-value">{rdvConfirme}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">RDV Complétés</span>
          <strong className="kpi-value">{rdvTermine}</strong>
        </div>
      </div>

      {/* ─── SECTION: VUE D'ENSEMBLE & ANALYTICS ────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <div className="panel-section">
          {error && <div className="panel error-panel" style={{ marginBottom: 16 }}>{error}</div>}

          {stats && stats.chart_data?.length > 0 ? (
            <div className="charts-grid">
              <div className="chart-panel">
                <h3>Évolution des visites et contacts</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.chart_data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="visites" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="contacts" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-panel">
                <h3>Comparatif Vues / Contacts</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.chart_data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visites" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="contacts" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel">
              <h3>Suivi de l'activité</h3>
              <p>Aucune donnée graphique disponible pour le moment. Vos statistiques apparaîtront dès vos premières visites sur vos stands.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION: MES STANDS & SALONS ─────────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'stands') && (
        <div className="panel-section" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Mes Stands</h3>
            {myStands.length === 0 ? (
              <p>Aucun stand enregistré pour le moment. Postulez ci-dessous pour ouvrir votre stand.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Salon</th>
                    <th>Statut</th>
                    <th>Date de fin</th>
                    <th>Visiteurs (est.)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myStands.map((stand) => (
                    <tr key={stand.id}>
                      <td><strong>{stand.company_name}</strong><br /><small>{getSalonTitle(stand.salon_id)}</small></td>
                      <td><StatusBadge status={standDisplayStatus(stand)} /></td>
                      <td>{getSalonEndDate(stand.salon_id)}</td>
                      <td>{standVisitors(stand)}</td>
                      <td>
                        <div className="row-actions">
                          {stand.status === 'VALIDE' && stand.payment_status !== 'PAID' && (
                            <button onClick={() => onPayStand(stand.id)} className="primary-btn small">Payer le stand</button>
                          )}
                          <button onClick={() => onViewStand(stand.id)} className="secondary-btn small">Voir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Réserver un nouveau stand</h3>
            <StandForm
              salons={salons}
              companies={ownedCompanies}
              onCreated={onStandCreated}
              token={token}
            />
          </div>
        </div>
      )}

      {/* ─── SECTION: GESTION DES RENDEZ-VOUS ──────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'rdvs') && (
        <div className="panel-section" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Gestion des rendez-vous reçus</h3>
            {myRdvs.length === 0 ? (
              <p>Aucun rendez-vous reçu pour le moment.</p>
            ) : (
              <div className="item-list">
                {myRdvs.map((rdv) => (
                  <article key={rdv.id} className="item-row rdv-row">
                    <div>
                      <strong>Salon : {getSalonTitle(rdv.salon_id)}</strong>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} /> Date proposée : <strong>{formatDate(rdv.proposed_datetime)}</strong>
                      </p>
                      <p>Importateur : <strong>{getCompanyName(rdv.importer_id)}</strong> • Statut : <StatusBadge status={{ label: rdv.status, tone: rdv.status === 'CONFIRME' || rdv.status === 'TERMINE' ? 'success' : rdv.status === 'REFUSE' ? 'error' : 'info' }} /></p>
                      {rdv.status === 'ALTERNATIVE_PROPOSEE' && rdv.alternative_datetimes?.length > 0 && (
                        <p><small>Créneaux proposés : {rdv.alternative_datetimes.map(formatDate).join(' • ')}</small></p>
                      )}
                      {altOpen[rdv.id] && (
                        <div className="alt-form">
                          <input
                            type="text"
                            placeholder="Ex: 2027-01-03T09:00:00, 2027-01-03T14:00:00"
                            value={altValue[rdv.id] || ''}
                            onChange={(e) => setAltValue((cur) => ({ ...cur, [rdv.id]: e.target.value }))}
                          />
                          <button onClick={() => submitAlt(rdv.id)} className="primary-btn small">Envoyer les créneaux</button>
                        </div>
                      )}
                    </div>
                    <div className="row-actions">
                      {(rdv.status === 'PROPOSE' || rdv.status === 'ALTERNATIVE_PROPOSEE') && (
                        <>
                          <button onClick={() => onConfirmRdv(rdv.id)} className="primary-btn small">Confirmer</button>
                          <button onClick={() => toggleAlt(rdv.id)} className="secondary-btn small">Proposer créneau</button>
                          <button onClick={() => onRefuseRdv(rdv.id)} className="secondary-btn small">Refuser</button>
                        </>
                      )}
                      {rdv.status === 'CONFIRME' && (
                        <>
                          <button onClick={() => onCompleteRdv(rdv.id)} className="primary-btn small">Terminer</button>
                          <button onClick={() => toggleAlt(rdv.id)} className="secondary-btn small">Proposer créneau</button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION: MES ENTREPRISES ───────────────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'companies') && (
        <div className="panel-section" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Mes Entreprises Exportatrices</h3>
            {ownedCompanies.length === 0 ? (
              <p>Aucune entreprise enregistrée. Veuillez créer une entreprise ci-dessous.</p>
            ) : (
              <div className="item-list">
                {ownedCompanies.map((company) => (
                  <article key={company.id} className="item-row">
                    <div>
                      <strong>{company.name}</strong>
                      <p>Pays : {company.country} • Statut validation : <span className="status-badge success">{company.profile_status}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Créer ou mettre à jour une Entreprise Exportatrice</h3>
            <CompanyForm onCreated={onCompanyCreated} token={token} />
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h3>Lancer un Salon Virtuel</h3>
            <SalonForm onCreated={onSalonCreated} token={token} />
          </div>
        </div>
      )}
    </div>
  );
}
