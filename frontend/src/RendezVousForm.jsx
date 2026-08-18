import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
];

export default function RendezVousForm({ salons, companies, onCreated, token, user }) {
  const [salonId, setSalonId] = useState('');
  const [exporterId, setExporterId] = useState('');
  const [importerId, setImporterId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const validSalons = salons.filter((salon) => salon.status === 'VALIDE');
  const exporters = companies.filter((company) => company.is_exporter && company.profile_status === 'VALIDE');
  const importers = companies.filter(
    (company) =>
      company.is_importer &&
      company.profile_status === 'VALIDE' &&
      (user?.role_id === 'admin' || company.owner_id === user?.id)
  );

  useEffect(() => {
    if (!salonId && validSalons.length > 0) {
      setSalonId(validSalons[0].id);
    }
  }, [validSalons, salonId]);

  useEffect(() => {
    if (!exporterId && exporters.length > 0) {
      setExporterId(exporters[0].id);
    }
  }, [exporters, exporterId]);

  useEffect(() => {
    if (!importerId && importers.length > 0) {
      setImporterId(importers[0].id);
    }
  }, [importers, importerId]);

  // Définir la date de demain par défaut
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedDate) {
      setMessage('Veuillez sélectionner une date.');
      return;
    }

    const startTime = selectedSlot.split(' - ')[0];
    const fullDatetime = `${selectedDate}T${startTime}:00`;

    const payload = {
      salon_id: salonId,
      exporter_id: exporterId,
      importer_id: importerId,
      proposed_datetime: fullDatetime,
      notes: notes || undefined,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/rendez-vous/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      setMessage(error.detail || 'Erreur lors de la réservation du rendez-vous.');
      return;
    }

    const rdv = await response.json();
    setMessage('📅 Demande de rendez-vous envoyée avec succès à l’exportateur !');
    setNotes('');
    onCreated(rdv);
  }

  return (
    <section className="panel rdv-form-shell">
      <h2>📅 Proposer un rendez-vous d'affaires</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Salon Virtuel *
          <select value={salonId} onChange={(e) => setSalonId(e.target.value)} disabled={!validSalons.length}>
            {validSalons.map((salon) => (
              <option key={salon.id} value={salon.id}>{salon.title}</option>
            ))}
          </select>
        </label>
        {!validSalons.length && <p className="error">Aucun salon validé disponible.</p>}

        <label>
          Société Exportatrice partenaire *
          <select value={exporterId} onChange={(e) => setExporterId(e.target.value)} disabled={!exporters.length}>
            {exporters.map((company) => (
              <option key={company.id} value={company.id}>{company.name} ({company.country})</option>
            ))}
          </select>
        </label>

        <label>
          Votre Société Importatrice *
          <select value={importerId} onChange={(e) => setImporterId(e.target.value)} disabled={!importers.length}>
            {importers.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </label>

        {/* Sélection Calendrier & Créneau */}
        <div className="date-picker-block">
          <label>
            Date souhaitée *
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </label>

          <label>Sélectionnez un créneau horaire :</label>
          <div className="slot-grid">
            {TIME_SLOTS.map((slot) => (
              <button
                type="button"
                key={slot}
                className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                ⏰ {slot}
              </button>
            ))}
          </div>
        </div>

        <label style={{ marginTop: '1rem' }}>
          Message / Sujets de discussion souhaités
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex: Discussion sur les conditions Tarifaires FOB, volumes annuels et échantillons..."
          />
        </label>

        <button
          type="submit"
          className="primary-btn"
          disabled={!validSalons.length || !exporters.length || !importers.length}
        >
          Envoyer la proposition de rendez-vous
        </button>
      </form>

      {message && <p className="form-feedback" style={{ marginTop: '0.5rem' }}>{message}</p>}
    </section>
  );
}
