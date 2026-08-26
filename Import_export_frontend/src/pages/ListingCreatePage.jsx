import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import FormField from "../components/molecules/FormField";
import Select from "../components/atoms/Select";
import SelectWithAdd from "../components/molecules/SelectWithAdd";
import ErrorMessage from "../components/atoms/ErrorMessage";
import SectionCard from "../components/molecules/SectionCard";
import FileDropzone from "../components/molecules/FileDropzone";
import { createListing, updateListing, getListingById } from "../api/listings";
import { getReferenceOptions, addReferenceOption } from "../api/referenceOptions";
import { colors, typography } from "../styles/tokens";

const TYPE_OPTIONS = [
  { value: "offer", label: "🚢 Offre (j'exporte)" },
  { value: "demand", label: "📦 Demande (j'importe)" },
];

const FALLBACK_INCOTERM_OPTIONS = [
  { value: "EXW", label: "EXW" },
  { value: "FOB", label: "FOB" },
  { value: "CIF", label: "CIF" },
];

const FALLBACK_QUANTITY_UNIT_OPTIONS = [
  { value: "kg", label: "Kg" },
  { value: "g", label: "g" },
  { value: "tonne", label: "Tonne" },
  { value: "L", label: "Litre" },
  { value: "m3", label: "m³" },
  { value: "piece", label: "Pièce" },
];

const FALLBACK_CURRENCY_OPTIONS = [
  { value: "TND", label: "TND" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

const FALLBACK_CATEGORY_OPTIONS = [
 { value: "Agroalimentaire", label: "Agroalimentaire" },
    { value: "Énergie", label: "Énergie" },
    { value: "Textile", label: "Textile" },
    { value: "Électronique", label: "Électronique" },
    { value: "Automobile", label: "Automobile" },
    { value: "Cosmétique", label: "Cosmétique" },
    { value: "Construction", label: "Construction" },
    { value: "Machines industrielles", label: "Machines industrielles" },
    { value: "Emballage & Logistique", label: "Emballage & Logistique" },
];

const FALLBACK_COUNTRY_OPTIONS = [
  { value: "Tunisie", label: "🇹🇳 Tunisie" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Italie", label: "🇮🇹 Italie" },
  { value: "Espagne", label: "🇪🇸 Espagne" },
  { value: "Allemagne", label: "🇩🇪 Allemagne" },
  { value: "Belgique", label: "🇧🇪 Belgique" },
  { value: "Pays-Bas", label: "🇳🇱 Pays-Bas" },
  { value: "Maroc", label: "🇲🇦 Maroc" },
  { value: "Algérie", label: "🇩🇿 Algérie" },
  { value: "Égypte", label: "🇪🇬 Égypte" },
  { value: "Turquie", label: "🇹🇷 Turquie" },
  { value: "Chine", label: "🇨🇳 Chine" },
  { value: "Inde", label: "🇮🇳 Inde" },
  { value: "États-Unis", label: "🇺🇸 États-Unis" },
  { value: "Canada", label: "🇨🇦 Canada" },
];

export default function ListingCreatePage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const [submitError, setSubmitError] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const [referenceOptions, setReferenceOptions] = useState({
    quantity_unit: FALLBACK_QUANTITY_UNIT_OPTIONS,
    currency: FALLBACK_CURRENCY_OPTIONS,
    country: FALLBACK_COUNTRY_OPTIONS,
    category: FALLBACK_CATEGORY_OPTIONS,
    incoterm: FALLBACK_INCOTERM_OPTIONS,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(["quantity_unit","currency","country","category","incoterm"].map(async (kind) => [kind, await getReferenceOptions(kind)]))
      .then((entries) => { if (!cancelled) setReferenceOptions((prev) => ({...prev, ...Object.fromEntries(entries)})); })
      .catch((err) => console.error("Impossible de charger les référentiels", err));
    return () => { cancelled = true; };
  }, []);

  async function handleAddReference(kind, value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      throw new Error("La valeur est obligatoire.");
    }

    const existing = (referenceOptions[kind] || []).find(
      (option) =>
        String(option.value).trim().toLowerCase() === trimmed.toLowerCase() ||
        String(option.label || "").trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const created = await addReferenceOption(kind, trimmed, trimmed);

    setReferenceOptions((previous) => {
      const list = previous[kind] || [];
      const alreadyInList = list.some(
        (option) =>
          String(option.value).trim().toLowerCase() ===
          String(created.value).trim().toLowerCase()
      );

      if (alreadyInList) {
        return previous;
      }

      return {
        ...previous,
        [kind]: [
          ...list,
          {
            id: created.id,
            value: created.value,
            label: created.label || created.value,
            is_custom: Boolean(created.is_custom),
          },
        ],
      };
    });

    return created;
  }

  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();


  const watchedValues = watch();
  const selectErrors = attemptedSubmit
    ? {
        type: !watchedValues.type ? "Type d'annonce requis" : null,
        category: !watchedValues.category ? "Catégorie requise" : null,
        quantityUnit: !watchedValues.quantityUnit ? "Unité requise" : null,
        currency: !watchedValues.currency ? "Devise requise" : null,
        incoterm: !watchedValues.incoterm ? "Incoterm requis" : null,
        country: !watchedValues.country ? "Pays requis" : null,
      }
    : {};


  function validateAttachments(data, files) {
    const incompleteFile = files.some(
      (file) => !file.label?.trim() || !file.type
    );
    if (incompleteFile) {
      return "Chaque document ajouté doit avoir un titre et un type renseignés.";
    }

    const declaredCertifications = (data.certifications || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (declaredCertifications.length > 0) {
      const hasCertificateDocument = files.some(
        (file) => file.type === "certificate"
      );
      if (!hasCertificateDocument) {
        return "Vous avez déclaré des certifications : merci de joindre au moins un document justificatif de type « Certification ».";
      }
    }

    return null;
  }

  useEffect(() => {
    if (!isEditMode) return;
    setIsLoadingListing(true);
    getListingById(id)
      .then((listing) => {
        reset({
          type: listing.type,
          product: listing.product,
          quantity: listing.quantity,
          quantityUnit: listing.quantityUnit,
          category: listing.category,
          price: listing.price,
          currency: listing.currency,
          incoterm: listing.incoterm,
          country: listing.country,
          deadline: listing.deadline,
          certifications: listing.certifications?.join(", ") || "",
        });
        setAttachments(listing.attachments || []);
      })
      .finally(() => setIsLoadingListing(false));
  }, [id, isEditMode, reset]);

async function onSubmit(data) {
  setSubmitError(null);
  setAttemptedSubmit(true);

  const missingSelectFields =
    !data.type ||
    !data.category ||
    !data.quantityUnit ||
    !data.incoterm ||
    !data.currency ||
    !data.country;

  if (missingSelectFields) {
    setSubmitError(
      "Merci de compléter tous les champs requis (indiqués en rouge ci-dessus)."
    );
    return;
  }

  const attachmentsError = validateAttachments(data, attachments);
  if (attachmentsError) {
    setSubmitError(attachmentsError);
    return;
  }

  try {
    const payload = {
      ...data,
      certifications: data.certifications
        ? data.certifications
            .split(",")
            .map((c) => c.trim())
        : [],
      attachments,
    };

    if (isEditMode) {
      await updateListing(id, payload);
      navigate("/listings/mine", {
        state: { successMessage: "Annonce modifiée avec succès." },
      });
    } else {
      await createListing(payload);
      navigate("/listings/mine", {
        state: { successMessage: "Annonce créée avec succès." },
      });
    }
  } catch (err) {
    setSubmitError(
      err.message ||
        "Erreur lors de l'enregistrement de l'annonce"
    );
  }
}
async function handleConfirmEdit() {
  setShowConfirmModal(false);

  if (!formDataToSubmit) return;

  await onSubmit(formDataToSubmit);
}
  const cardStyle = {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "30px",
    marginBottom: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  };

  const sectionTitleStyle = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#14161C",
    marginBottom: "24px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F5F2",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
            }}
          >
            📦
          </div>

          <h1
            style={{
              fontSize: "42px",
              fontWeight: "700",
              color: "#14161C",
              marginBottom: "10px",
            }}
          >
            {isEditMode ? "Modifier l'annonce" : "Publier une annonce"}
          </h1>

          <p
            style={{
              color: "#6b7280",
              fontSize: "18px",
            }}
          >
            {isEditMode
              ? "Mettez à jour les informations de votre annonce"
              : "Créez rapidement une offre ou une demande"}
          </p>
        </div>

        {isLoadingListing ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>Chargement de l'annonce...</p>
        ) : (
<form
  onSubmit={handleSubmit((data) => {
    setSubmitError(null);
    setAttemptedSubmit(true);

    const attachmentsError = validateAttachments(data, attachments);
    if (attachmentsError) {
      setSubmitError(attachmentsError);
      return;
    }

    if (isEditMode) {
      setFormDataToSubmit(data);
      setShowConfirmModal(true);
      return;
    }

    onSubmit(data);
  })}
>          

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              📦 Informations produit
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontFamily: typography.body,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Type d'annonce
              </label>

              <Select
                options={TYPE_OPTIONS}
                placeholder="Choisir un type"
                value={watch("type")}
                onChange={(value) =>
                  setValue("type", value)
                }
                error={selectErrors.type}
              />
            </div>

            <FormField
              label="Produit"
              name="product"
              register={register}
              rules={{
                required: "Produit requis",
              }}
              error={errors.product}
            />

            <div
              className="grid-main-side"
              style={{
                gap: "15px",
              }}
            >
              <FormField
                label="Quantité"
                name="quantity"
                register={register}
                rules={{
                  required: "Quantité requise",
                }}
                error={errors.quantity}
              />

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontFamily: typography.body,
                    fontSize: 14,
                    fontWeight: 600,
                    color: colors.textPrimary,
                  }}
                >
                  Unité
                </label>

                <SelectWithAdd
                  options={referenceOptions.quantity_unit}
                  placeholder="Unité"
                  addPlaceholder="Ex: Palette"
                  onAdd={(value) => handleAddReference("quantity_unit", value)}
                  value={watch("quantityUnit")}
                  onChange={(value) =>
                    setValue(
                      "quantityUnit",
                      value
                    )
                  }
                  error={selectErrors.quantityUnit}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontFamily: typography.body,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Catégorie
              </label>

              <SelectWithAdd
                options={referenceOptions.category}
                placeholder="Choisir une catégorie"
                addPlaceholder="Ex: Ameublement"
                onAdd={(value) => handleAddReference("category", value)}
                value={watch("category")}
                onChange={(value) =>
                  setValue("category", value)
                }
                error={selectErrors.category}
              />
            </div>
          </div>

          {/* SECTION COMMERCIALE */}

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              💰 Conditions commerciales
            </h2>

            <div
              className="grid-main-side"
              style={{
                gap: "15px",
              }}
            >
              <FormField
                label="Prix"
                name="price"
                register={register}
                rules={{
                  required: "Prix requis",
                }}
                error={errors.price}
              />

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontFamily: typography.body,
                    fontSize: 14,
                    fontWeight: 600,
                    color: colors.textPrimary,
                  }}  
                >
                  Devise
                </label>

                <SelectWithAdd
                  options={referenceOptions.currency}
                  placeholder="Devise"
                  addPlaceholder="Ex: TND"
                  onAdd={(value) => handleAddReference("currency", value)}
                  value={watch("currency")}
                  onChange={(value) =>
                    setValue(
                      "currency",
                      value
                    )
                  }
                  error={selectErrors.currency}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontFamily: typography.body,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Incoterm
              </label>

              <SelectWithAdd
                options={referenceOptions.incoterm}
                placeholder="Choisir un incoterm"
                addPlaceholder="Ex: DAF"
                onAdd={(value) => handleAddReference("incoterm", value)}
                value={watch("incoterm")}
                onChange={(value) =>
                  setValue("incoterm", value)
                }
                error={selectErrors.incoterm}
              />
            </div>
          </div>

          {/* SECTION LOGISTIQUE */}

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              🚚 Logistique & conformité
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontFamily: typography.body,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Pays
              </label>

              <SelectWithAdd
                options={referenceOptions.country}
                placeholder="Choisir un pays"
                addPlaceholder="Ex: Qatar"
                onAdd={(value) => handleAddReference("country", value)}
                value={watch("country")}
                onChange={(value) =>
                  setValue("country", value)
                }
                error={selectErrors.country}
              />
            </div>

            <FormField
              label="Délai (date)"
              name="deadline"
              type="date"
              register={register}
              error={errors.deadline}
            />

            <FormField
              label="Certifications (séparées par des virgules)"
              name="certifications"
              register={register}
              error={errors.certifications}
            />
          </div>

          {/* SECTION PIÈCES JOINTES */}

          <SectionCard title="📎 Pièces jointes">
            <FileDropzone
              files={attachments}
              onChange={setAttachments}
              showValidation={attemptedSubmit}
            />
          </SectionCard>

          {/* ERREUR */}
          <ErrorMessage>
            {submitError}
          </ErrorMessage>

          {/* BOUTON */}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "18px",
              border: "none",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg,#B8720A,#9C5E08)",
              color: "white",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow:
            "0 8px 20px rgba(184,114,10,0.45)",
            }}
          >
            {isEditMode ? "💾 Enregistrer les modifications" : "🚀 Publier l'annonce"}
          </button>
          {showConfirmModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        width: "420px",
        maxWidth: "90%",
        borderRadius: "20px",
        padding: "28px",
        boxShadow:
          "0 20px 40px rgba(0,0,0,0.2)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "12px",
        }}
      >
        ✏️ Modifier l'annonce ?
      </h3>

      <p
        style={{
          color: "#6b7280",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        Les modifications apportées à cette
        annonce seront enregistrées immédiatement.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowConfirmModal(false)
          }
          style={{
            padding: "10px 16px",
            border:
              "1px solid #E4E2DC",
            borderRadius: "10px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleConfirmEdit}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: "#B8720A",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Oui, modifier
        </button>
      </div>
    </div>
  </div>
)}
        </form>
        
        )}
      </div>
    </div>
  );
}