import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function StandDetail({ standId, token, onBack, user }) {
  const [stand, setStand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    fetchStandDetails();
  }, [standId]);

  const fetchStandDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/stands/${standId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStand(await res.json());
      } else {
        setError("Erreur lors du chargement du stand");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (user?.role_id !== 'importer') {
      setContactMessage("Seuls les importateurs peuvent initier une conversation.");
      return;
    }

    try {
      const compRes = await fetch(`${API_BASE}/companies?is_importer=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const companies = await compRes.json();

      if (companies.length === 0) {
        setContactMessage("Vous devez d'abord créer une entreprise importatrice.");
        return;
      }

      const res = await fetch(`${API_BASE}/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stand_id: standId,
          importer_id: companies[0].id
        })
      });

      if (res.ok) {
        setContactMessage("Conversation créée avec succès ! Rendez-vous dans l'onglet Messagerie.");
      } else {
        const err = await res.json();
        setContactMessage(err.detail || "Erreur lors de la création de la conversation.");
      }
    } catch (err) {
      setContactMessage("Erreur réseau.");
    }
  };

  if (loading) return <div className="panel">Chargement des détails du stand...</div>;
  if (error) return <div className="panel error-panel">{error}</div>;
  if (!stand) return <div className="panel">Stand introuvable.</div>;

  const isVideoDirect = stand.video_url && (stand.video_url.endsWith('.mp4') || stand.video_url.endsWith('.webm') || stand.video_url.startsWith('/static/'));
  const isVideoYoutube = stand.video_url && (stand.video_url.includes('youtube.com') || stand.video_url.includes('youtu.be'));

  return (
    <div className="stand-detail-container panel">
      <button onClick={onBack} className="secondary-btn" style={{ marginBottom: '1rem' }}>
        ← Retour aux exposants
      </button>

      {/* Header Stand & Exportateur */}
      <div className="stand-header">
        <div>
          <h2>{stand.company_name}</h2>
          <span className="country-tag">🌍 {stand.company?.country || 'Exportateur International'}</span>
        </div>
        <span className="status-badge">{stand.status}</span>
      </div>

      {/* Lecteur Vidéo de Présentation Produit */}
      {stand.video_url && (
        <div className="video-section panel">
          <h3>📹 Présentation vidéo de l'exportateur</h3>
          {isVideoDirect ? (
            <video
              controls
              className="video-player"
              style={{ width: '100%', maxHeight: '450px', borderRadius: '8px' }}
              src={stand.video_url.startsWith('/') ? `${API_BASE}${stand.video_url}` : stand.video_url}
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          ) : isVideoYoutube ? (
            <div className="video-container">
              <iframe
                src={stand.video_url.replace('watch?v=', 'embed/')}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Présentation entreprise"
                style={{ width: '100%', height: '400px', borderRadius: '8px' }}
              />
            </div>
          ) : (
            <p><a href={stand.video_url} target="_blank" rel="noreferrer" className="primary-btn small">Regarder la vidéo externe ↗</a></p>
          )}
        </div>
      )}

      {/* Informations Complètes Exportateur & Produits */}
      <div className="stand-info-grid">
        <div className="info-card panel">
          <h3>📦 Produits & Services présentés</h3>
          <p>{stand.products || "Aucun produit renseigné."}</p>
        </div>

        <div className="info-card panel">
          <h3>🏷️ Certifications & Normes de Qualité</h3>
          <p>{stand.certifications || "Aucune certification renseignée."}</p>
        </div>

        {stand.company && (
          <div className="info-card panel">
            <h3>🏢 Profil & Description de l'entreprise</h3>
            <p><strong>Pays d'origine :</strong> {stand.company.country}</p>
            <p>{stand.company.description || "Aucune description détaillée d'entreprise."}</p>
            {stand.company.website && (
              <p><a href={stand.company.website} target="_blank" rel="noreferrer" className="secondary-btn small">Visiter le site officiel ↗</a></p>
            )}
          </div>
        )}
      </div>

      {/* Section Téléchargements & Documents Jointes */}
      <div className="documents-section panel">
        <h3>📁 Documents téléchargeables (Catalogues, Fiches techniques, Certificats)</h3>
        {(!stand.documents || stand.documents.length === 0) ? (
          <p>Aucun document joint pour le moment.</p>
        ) : (
          <ul className="doc-list">
            {stand.documents.map((doc, idx) => {
              const fileUrl = doc.url ? (doc.url.startsWith('/') ? `${API_BASE}${doc.url}` : doc.url) : '#';
              return (
                <li key={idx} className="doc-item">
                  <span>📄 <strong>{doc.name || `Document #${idx + 1}`}</strong> {doc.size && `(${doc.size})`}</span>
                  <a href={fileUrl} target="_blank" rel="noreferrer" download className="secondary-btn small">
                    Télécharger ⬇
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Actions & Contact Importateur */}
      <div className="stand-actions panel">
        <h3>💬 Entrer en relation d'affaires</h3>
        {user?.role_id === 'importer' ? (
          <div className="contact-section">
            <button onClick={handleContact} className="primary-btn">
              Contacter l'exportateur & Initier une négociation 💬
            </button>
            {contactMessage && <p className="form-feedback" style={{ marginTop: '0.5rem' }}>{contactMessage}</p>}
          </div>
        ) : (
          <p>Connectez-vous en tant qu'<strong>Importateur</strong> pour engager une négociation avec cet exposant.</p>
        )}
      </div>
    </div>
  );
}
