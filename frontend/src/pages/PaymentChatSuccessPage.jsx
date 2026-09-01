import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PaymentChatSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isAuthenticated } = useAuth();

  return (
    <div className="login-shell">
      <div className="login-card payment-result-card">
        <div className="login-header">
          <p className="login-brand">Salons Virtuels</p>
          <h1>Abonnement activé</h1>
          <p className="login-subtitle">Votre accès à la messagerie a été mis à jour.</p>
        </div>

        {sessionId && (
          <p className="muted-text">Session : {sessionId}</p>
        )}

        <div className="payment-result-actions">
          {isAuthenticated ? (
            <>
              <Link to="/messaging" className="primary-btn">Ouvrir la messagerie</Link>
              <Link to="/" className="secondary-btn">Retour au dashboard</Link>
            </>
          ) : (
            <Link to="/" className="primary-btn">Se connecter</Link>
          )}
        </div>
      </div>
    </div>
  );
}
