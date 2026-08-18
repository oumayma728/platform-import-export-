import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './api.js';

export default function PaymentModal({ token, onClose, embedded = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/billing/subscribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || 'Erreur lors de la création de la session Stripe');
      }
    } catch {
      setError('Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPack = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/billing/create-payment-intent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.detail || 'Erreur lors de la création de la session Stripe');
      }
    } catch {
      setError('Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={embedded ? 'payment-modal embedded' : 'modal-content payment-modal'}>
      {!embedded && onClose && (
        <button type="button" className="close-btn" onClick={onClose}>&times;</button>
      )}
      <h2>Débloquez la messagerie</h2>
      <p>Vous avez atteint la limite de 50 messages gratuits.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="pricing-options">
        <div className="pricing-card">
          <h3>Pack de 200 messages</h3>
          <p className="price">99 MAD</p>
          <p className="desc">Idéal pour un usage ponctuel.</p>
          <button type="button" onClick={handleBuyPack} disabled={loading} className="secondary-btn">
            Acheter le pack
          </button>
        </div>

        <div className="pricing-card premium">
          <h3>Messagerie Illimitée</h3>
          <p className="price">290 MAD <span>/ mois</span></p>
          <p className="desc">Communiquez sans limites avec tous vos partenaires importateurs & exportateurs.</p>
          <button type="button" onClick={handleSubscribe} disabled={loading} className="primary-btn">
            S'abonner
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="modal-overlay">
      {content}
    </div>
  );
}
