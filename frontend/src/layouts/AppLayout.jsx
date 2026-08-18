import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut, MessageSquare, ShoppingBag, User, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/salons';
    }
    return location.pathname.startsWith(path);
  };

  const roleLabel = {
    admin: 'Administrateur',
    exporter: 'Exportateur Maroc',
    importer: 'Importateur',
  }[user.role_id] || user.role_id;

  return (
    <div className="app-shell">
      {/* ─────────────────────────────────────────────────────────────
         EN-TÊTE PRINCIPAL ÉLÉGANT & PROFESSIONNEL (TOP NAVBAR)
         ───────────────────────────────────────────────────────────── */}
      <header className="app-top-header">
        <div className="header-left">
          <Link to="/dashboard" className="brand-logo-link">
            <div className="brand-icon-box">
              <Globe size={22} className="icon-blue" />
            </div>
            <div className="brand-text-box">
              <span className="brand-title">SalonsVirtuels.ma</span>
              <span className="brand-subtitle">Plateforme Nationale d'Export & Import</span>
            </div>
          </Link>
        </div>

        <nav className="header-center-nav">
          <Link to="/dashboard" className={`top-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={17} />
            <span>Tableau de bord</span>
          </Link>
          {user.role_id !== 'admin' && (
            <Link to="/messaging" className={`top-nav-item ${isActive('/messaging') || isActive('/conversations') ? 'active' : ''}`}>
              <MessageSquare size={17} />
              <span>Messagerie</span>
            </Link>
          )}
          <Link to="/marketplace" className={`top-nav-item ${isActive('/marketplace') ? 'active' : ''}`}>
            <ShoppingBag size={17} />
            <span>Marketplace</span>
          </Link>
        </nav>

        <div className="header-right">
          {user.role_id !== 'admin' && (
            <div className="chat-quota-pill">
              {user.has_paid_chat_access ? (
                <span className="quota-badge premium">
                  <Sparkles size={13} /> Messagerie Illimitée
                </span>
              ) : (
                <span className="quota-badge info">
                  Messages: <strong>{50 - (user.free_chats_used || 0)}/50</strong>
                </span>
              )}
              {!user.has_paid_chat_access && (user.free_chats_used || 0) >= 40 && (
                <Link to="/subscription" className="unlock-btn">
                  Débloquer
                </Link>
              )}
            </div>
          )}

          <div className="user-profile-pill">
            <div className="user-avatar-small">
              <User size={16} />
            </div>
            <div className="user-info-text">
              <span className="user-name">{user.full_name || user.email}</span>
              <span className="user-role">{roleLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="logout-btn"
            title="Se déconnecter"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
         CONTENU PRINCIPAL SANS DUPLICATION NI ENCOMBREMENT
         ───────────────────────────────────────────────────────────── */}
      <main className="main-content-container">
        <Outlet />
      </main>
    </div>
  );
}
