import { Link } from 'react-router-dom';
import PaymentModal from '../PaymentModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SubscriptionPage() {
  const { token } = useAuth();

  return (
    <section className="panel">
      <Link to="/" className="secondary-btn small" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        ← Retour au dashboard
      </Link>
      <PaymentModal token={token} embedded />
    </section>
  );
}
