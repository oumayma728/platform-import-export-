import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const standId = searchParams.get('stand_id');
  const sessionId = searchParams.get('session_id');
  const { token, isAuthenticated, fetchWithAuth } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!standId || !isAuthenticated) {
      return;
    }

    fetchWithAuth(`${API_BASE}/payments/stands/${standId}/status`)
      .then((res) => res.json())
      .then(setStatus)
      .catch((err) => {
        if (err.message !== 'Session invalide') {
          setError('Impossible de vérifier le statut du paiement.');
        }
      });
  }, [standId, isAuthenticated, fetchWithAuth]);

  return (
    <div className="login-shell">
      <div className="login-card payment-result-card">
        <div className="login-header">
          <p className="login-brand">Salons Virtuels</p>
          <h1>Paiement confirmé</h1>
          <p className="login-subtitle">Votre réservation de stand a été enregistrée.</p>
        </div>

        {standId && (
          <p className="success-badge">Stand : {standId}</p>
        )}
        {sessionId && (
          <p className="muted-text">Session : {sessionId}</p>
        )}
        {status && (
          <p>Statut paiement : <strong>{status.payment_status}</strong></p>
        )}
        {error && <p className="login-error">{error}</p>}

        <div className="payment-result-actions">
          {isAuthenticated ? (
            <>
              <Link to="/" className="primary-btn">Retour au dashboard</Link>
              {standId && (
                <Link to={`/stands/${standId}`} className="secondary-btn">Voir le stand</Link>
              )}
            </>
          ) : (
            <Link to="/" className="primary-btn">Se connecter</Link>
          )}
        </div>
      </div>
    </div>
  );
}
