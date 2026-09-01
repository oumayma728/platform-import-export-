import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function CompanyForm({ onCreated, token }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [isExporter, setIsExporter] = useState(true);
  const [isImporter, setIsImporter] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      id: `company-${Date.now()}`,
      name,
      country,
      description,
      is_exporter: isExporter,
      is_importer: isImporter,
      profile_status: 'EN_ATTENTE_VALIDATION',
      certification_docs: []
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setMessage('Erreur lors de la création de l’entreprise');
      return;
    }

    const company = await response.json();
    setMessage('Entreprise créée, statut EN_ATTENTE_VALIDATION.');
    setName('');
    setCountry('');
    setDescription('');
    setIsExporter(true);
    setIsImporter(false);
    onCreated(company);
  }

  return (
    <section className="company-form">
      <h3>Créer une entreprise</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Nom de l'entreprise
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Pays
          <input value={country} onChange={(e) => setCountry(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={isExporter} onChange={(e) => setIsExporter(e.target.checked)} />
          Exportateur
        </label>
        <label>
          <input type="checkbox" checked={isImporter} onChange={(e) => setIsImporter(e.target.checked)} />
          Importateur
        </label>
        <button type="submit">Créer</button>
      </form>
      {message && <p>{message}</p>}
    </section>
  );
}
