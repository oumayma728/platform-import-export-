import { useState } from 'react';

function LoginScreen({ onLogin, error, loading }) {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(form.email, form.password);
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <p className="login-brand">Salons Virtuels</p>
          <h1>Connexion</h1>
          <p className="login-subtitle">Accédez à votre espace professionnel</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="prenom@entreprise.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
