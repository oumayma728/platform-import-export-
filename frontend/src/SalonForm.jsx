import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function SalonForm({ onCreated, token }) {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [standPrice, setStandPrice] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setMessage('La date de début doit être antérieure à la date de fin.');
      return;
    }

    const payload = {
      title,
      theme: theme || undefined,
      category: category || undefined,
      description: description || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      stand_price: standPrice ? Number(standPrice) : undefined,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/salons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage('Erreur lors de la création du salon.');
      return;
    }

    const salon = await response.json();
    setMessage('Salon créé avec succès.');
    setTitle('');
    setTheme('');
    setCategory('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStandPrice('');
    onCreated(salon);
  }

  return (
    <section className="panel">
      <h2>Créer un salon virtuel</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Titre du salon
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Thème
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="ex: Agrotech & Innovation" />
        </label>
        <label>
          Catégorie
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex: Agriculture, High-Tech..." />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Date de début
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          Date de fin
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
        <label>
          Prix du stand (€)
          <input type="number" min="0" step="0.01" value={standPrice} onChange={(e) => setStandPrice(e.target.value)} placeholder="499.00" required />
        </label>
        <button type="submit" className="primary-btn">Créer le salon</button>
      </form>
      {message && <p className="form-feedback">{message}</p>}
    </section>
  );
}
