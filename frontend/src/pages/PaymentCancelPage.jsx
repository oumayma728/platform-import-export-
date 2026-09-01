import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const standId = searchParams.get('stand_id');
  const { isAuthenticated } = useAuth();

  return (
    <div className="login-shell">
      <div className="login-card payment-result-card">
        <div className="login-header">
          <p className="login-brand">Salons Virtuels</p>
          <h1>Paiement annulé</h1>
          <p className="login-subtitle">Votre paiement n’a pas été finalisé.</p>
        </div>

        {standId && (
          <p className="muted-text">Stand concerné : {standId}</p>
        )}

        <div className="payment-result-actions">
          {isAuthenticated ? (
            <>
              <Link to="/" className="primary-btn">Retour au dashboard</Link>
              <Link to="/subscription" className="secondary-btn">Voir les abonnements</Link>
            </>
          ) : (
            <Link to="/" className="primary-btn">Se connecter</Link>
          )}
        </div>
      </div>
    </div>
  );
}
