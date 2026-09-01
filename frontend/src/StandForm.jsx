import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function StandForm({ salons, companies, onCreated, token }) {
  const validSalons = salons.filter((salon) => salon.status === 'VALIDE');
  const validExporterCompanies = companies.filter((company) => company.is_exporter && company.profile_status === 'VALIDE');
  
  const [salonId, setSalonId] = useState(validSalons.length ? validSalons[0].id : '');
  const [companyId, setCompanyId] = useState(validExporterCompanies.length ? validExporterCompanies[0].id : '');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState('');
  const [certifications, setCertifications] = useState('');
  
  // Vidéo
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Documents multiples (PDF, PNG, JPG)
  const [docFiles, setDocFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docError, setDocError] = useState('');

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (validSalons.length && !salonId) {
      setSalonId(validSalons[0].id);
    }
  }, [validSalons, salonId]);

  useEffect(() => {
    if (validExporterCompanies.length && !companyId) {
      setCompanyId(validExporterCompanies[0].id);
    }
  }, [validExporterCompanies, companyId]);

  // Validation & Upload vidéo
  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setVideoError('Format non pris en charge. Veuillez choisir une vidéo MP4 ou WebM.');
      setVideoFile(null);
      return;
    }

    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setVideoError(`Taille maximale dépassée (${maxSizeMB} MB max).`);
      setVideoFile(null);
      return;
    }

    setVideoError('');
    setVideoFile(file);
    setIsUploadingVideo(true);
    setVideoProgress(10);

    // Simulation d'upload avec progression
    try {
      const interval = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/uploads/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setVideoProgress(100);
        setVideoUrl(data.url);
      } else {
        setVideoError("Erreur lors de l'upload de la vidéo.");
      }
    } catch (err) {
      setVideoError("Impossible de communiquer avec le serveur d'upload.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Upload documents multiples (PDF, PNG, JPG)
  const handleDocsSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setDocError('');
    const newUploaded = [...uploadedDocs];

    for (const file of files) {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        setDocError(`Fichier non accepté : ${file.name} (PDF, PNG, JPG requis).`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const res = await fetch(`${API_BASE}/uploads/`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newUploaded.push({
            name: file.name,
            url: data.url,
            type: file.type,
            size: (file.size / 1024).toFixed(1) + ' KB',
          });
        }
      } catch (err) {
        setDocError("Erreur d'upload de document.");
      }
    }

    setUploadedDocs(newUploaded);
  };

  const removeDoc = (index) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (!products.trim()) {
      setMessage('Veuillez renseigner les produits présentés.');
      return;
    }

    const company = companies.find((c) => c.id === companyId);
    if (!company) {
      setMessage('Sélectionnez une entreprise valide');
      return;
    }

    const payload = {
      exporter_id: companyId,
      company_name: companyName.trim() || company.name,
      products: products.trim(),
      certifications: certifications.trim() || undefined,
      video_url: videoUrl || undefined,
      documents: uploadedDocs,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/salons/${salonId}/stands`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      setMessage(error.detail || 'Erreur lors de la réservation de stand');
      return;
    }

    const stand = await response.json();
    setMessage('Demande de stand créée avec succès ! En attente de validation.');
    setProducts('');
    setCertifications('');
    setVideoFile(null);
    setVideoUrl('');
    setUploadedDocs([]);
    setVideoProgress(0);
    onCreated(stand);
  }

  return (
    <section className="stand-form panel">
      <h3>Réserver un stand de présentation</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Salon Virtuel cible *
          <select value={salonId} onChange={(e) => setSalonId(e.target.value)} disabled={!validSalons.length}>
            {validSalons.map((salon) => (
              <option key={salon.id} value={salon.id}>{salon.title} ({salon.category || 'Général'})</option>
            ))}
          </select>
        </label>
        {!validSalons.length && (
          <p className="error">Aucun salon publié n'est disponible pour réserver un stand.</p>
        )}

        <label>
          Entreprise exportatrice *
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={!validExporterCompanies.length}>
            {validExporterCompanies.map((company) => (
              <option key={company.id} value={company.id}>{company.name} ({company.country})</option>
            ))}
          </select>
        </label>

        <label>
          Nom affiché du stand
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Laisser vide pour utiliser le nom de l'entreprise"
          />
        </label>

        <label>
          Produits et services présentés *
          <textarea
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="Décrivez vos produits phare, caractéristiques techniques, quantités disponibles..."
            required
          />
        </label>

        <label>
          Certifications & Normes (ISO, Bio, Halal, CE...)
          <input
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="ex: ISO 9001, Fairtrade, AB Bio"
          />
        </label>

        {/* Upload Vidéo */}
        <div className="upload-block">
          <label>
            Présentation vidéo du stand (MP4, WebM - Max 50 MB)
            <input type="file" accept="video/mp4,video/webm" onChange={handleVideoSelect} />
          </label>
          {isUploadingVideo && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${videoProgress}%` }}></div>
              <span>{videoProgress}%</span>
            </div>
          )}
          {videoError && <p className="error">{videoError}</p>}
          {videoUrl && <p className="success-badge">✅ Vidéo téléversée avec succès</p>}
        </div>

        {/* Upload Documents multiples */}
        <div className="upload-block">
          <label>
            Documents supplémentaires (Brochures PDF, Images PNG/JPG)
            <input type="file" accept="application/pdf,image/png,image/jpeg" multiple onChange={handleDocsSelect} />
          </label>
          {docError && <p className="error">{docError}</p>}

          {/* Prévisualisation des documents */}
          {uploadedDocs.length > 0 && (
            <div className="doc-previews">
              <p>Documents prêts à être joints ({uploadedDocs.length}) :</p>
              <ul>
                {uploadedDocs.map((doc, idx) => (
                  <li key={idx} className="doc-preview-item">
                    <span>📄 {doc.name} ({doc.size})</span>
                    <button type="button" className="danger-btn small" onClick={() => removeDoc(idx)}>Supprimer</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="primary-btn"
          disabled={!validSalons.length || !validExporterCompanies.length || isUploadingVideo}
        >
          Valider l'inscription et passer au paiement
        </button>
      </form>

      {message && <p className="form-feedback">{message}</p>}
    </section>
  );
}
