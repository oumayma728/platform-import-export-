import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check } from "lucide-react";

import FormField from "../components/molecules/FormField";
import Select from "../components/atoms/Select";
import Button from "../components/atoms/Button";
import ErrorMessage from "../components/atoms/ErrorMessage";
import Textarea from "../components/atoms/Textarea";
import Reveal from "../components/atoms/Reveal";
import FileDropzone, { DOCUMENT_TYPES } from "../components/molecules/FileDropzone";

import { completeProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing, typography } from "../styles/tokens";

const COUNTRY_OPTIONS = [
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

const SECTOR_OPTIONS = [
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

// Au niveau du compte, seuls les certificats et "autre" ont du sens
// (contrairement à une annonce, il n'y a pas de photo produit ou de fiche
// technique à joindre ici).
const ACCOUNT_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((t) =>
  ["certificate", "other"].includes(t.value)
);

const STEPS = [
  { id: 1, label: "Entreprise" },
  { id: 2, label: "Certifications" },
  { id: 3, label: "Description" },
];

export default function ProfileCompletionPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificationDocs, setCertificationDocs] = useState([]);
  const [attemptedStep2, setAttemptedStep2] = useState(false);
  const [selectErrors, setSelectErrors] = useState({});

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  async function goNext() {
    setSubmitError(null);

    if (currentStep === 1) {
      const companyNameValid = await trigger("companyName");
      const nextSelectErrors = {};
      if (!watch("country")) nextSelectErrors.country = "Pays requis";
      if (!watch("sector")) nextSelectErrors.sector = "Secteur requis";
      setSelectErrors(nextSelectErrors);
      if (!companyNameValid || Object.keys(nextSelectErrors).length > 0) return;
    }

    if (currentStep === 2) {
      setAttemptedStep2(true);

      const hasIncompleteDocument = certificationDocs.some((file) => !file.type);
      if (hasIncompleteDocument) {
        setSubmitError("Sélectionnez un type pour chaque document joint.");
        return;
      }

      const declaredCertifications = watch("certifications")?.trim();
      const hasCertificateDocument = certificationDocs.some(
        (file) => file.type === "certificate"
      );
      if (declaredCertifications && !hasCertificateDocument) {
        setSubmitError(
          "Vous avez déclaré des certifications : joignez au moins un document de type « Certification » pour les justifier."
        );
        return;
      }
    }

    setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  }

  function goBack() {
    setSubmitError(null);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function onSubmit(data) {
    setSubmitError(null);

    if (!data.description || data.description.trim().length < 20) {
      setSubmitError("La description de l'entreprise doit contenir au moins 20 caractères.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        certifications: data.certifications
          ? data.certifications.split(",").map((c) => c.trim())
          : [],
        certificationDocs,
      };

      const updated = await completeProfile(payload);

      updateUser({
        profile: updated.profile,
        profileStatus: updated.profileStatus,
      });

      navigate("/onboarding/listing");
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de l'enregistrement du profil");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#F6F5F2 0%,#FBF0DC 100%)",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* HEADER */}
        <Reveal style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🏢</div>
          <span className="eyebrow">Étape obligatoire</span>
          <h1
            style={{
              fontFamily: typography.display,
              fontSize: "40px",
              fontWeight: "800",
              letterSpacing: "-0.01em",
              color: colors.textPrimary,
              marginBottom: "12px",
            }}
          >
            Compléter votre profil entreprise
          </h1>
          <p
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              color: colors.textMuted,
              fontFamily: typography.body,
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Fournissez les informations de votre société afin d'accéder aux
            meilleures opportunités d'importation et d'exportation.
          </p>
        </Reveal>

        {/* INDICATEUR DE PROGRESSION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            marginBottom: spacing.xl,
          }}
        >
          {STEPS.map((step, index) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    backgroundColor:
                      step.id < currentStep
                        ? colors.success
                        : step.id === currentStep
                        ? colors.primary
                        : "#fff",
                    color: step.id <= currentStep ? "#fff" : colors.textMuted,
                    border: step.id === currentStep ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  }}
                >
                  {step.id < currentStep ? <Check size={18} /> : step.id}
                </div>
                <span
                  style={{
                    marginTop: 6,
                    fontSize: 12.5,
                    fontWeight: step.id === currentStep ? 700 : 500,
                    color: step.id === currentStep ? colors.primary : colors.textMuted,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  style={{
                    width: 60,
                    height: 2,
                    marginBottom: 18,
                    backgroundColor: step.id < currentStep ? colors.success : colors.border,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* CARD */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 20px 60px rgba(14,21,38,0.08)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div key={currentStep} className="hero-fade-1">
            {/* ÉTAPE 1 : ENTREPRISE */}
            {currentStep === 1 && (
              <>
                <FormField
                  label="Nom de l'entreprise"
                  name="companyName"
                  register={register}
                  rules={{ required: "Nom d'entreprise requis" }}
                  error={errors.companyName}
                />

                <div
                  className="grid-2-col"
                  style={{
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                      🌍 Pays
                    </label>
                    <Select
                      options={COUNTRY_OPTIONS}
                      placeholder="Choisir un pays"
                      value={watch("country")}
                      onChange={(value) => setValue("country", value)}
                      error={selectErrors.country}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                      🏭 Secteur
                    </label>
                    <Select
                      options={SECTOR_OPTIONS}
                      placeholder="Choisir un secteur"
                      value={watch("sector")}
                      onChange={(value) => setValue("sector", value)}
                      error={selectErrors.sector}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ÉTAPE 2 : CERTIFICATIONS */}
            {currentStep === 2 && (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "16px",
                  background: "#F6F5F2",
                  marginBottom: "20px",
                  border: "1px solid #E4E2DC",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "16px" }}>
                  ✅ Certifications
                </h3>
                <p style={{ color: "#6B6D76", marginTop: 0, fontSize: "14px" }}>
                  Exemple : ISO 9001, BIO, CE, HACCP...
                </p>
                <FormField
                  label=""
                  name="certifications"
                  register={register}
                  error={errors.certifications}
                />

                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "10px" }}>
                    📎 Justificatifs (obligatoire si vous déclarez des certifications)
                  </p>
                  <FileDropzone
                    files={certificationDocs}
                    onChange={setCertificationDocs}
                    documentTypes={ACCOUNT_DOCUMENT_TYPES}
                    showValidation={attemptedStep2}
                  />
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : DESCRIPTION */}
            {currentStep === 3 && (
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                    fontSize: typography.fontSizeBase,
                  }}
                >
                  📝 Description de l'entreprise
                </label>
                <p style={{ color: "#6B6D76", marginTop: 0, marginBottom: 10, fontSize: "14px" }}>
                  Présentez votre activité, vos produits phares et ce qui vous distingue
                  (20 caractères minimum).
                </p>
                <Textarea
                  name="description"
                  placeholder="Ex : Producteur d'huile d'olive extra vierge depuis 1998, certifié BIO, exportant vers l'Europe et l'Amérique du Nord..."
                  rows={6}
                  register={(fieldName) =>
                    register(fieldName, {
                      required: "Description requise",
                      minLength: { value: 20, message: "20 caractères minimum" },
                    })
                  }
                  error={errors.description}
                />
              </div>
            )}
            </div>

            {/* ERREUR */}
            <ErrorMessage>{submitError}</ErrorMessage>

            {/* NAVIGATION */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: spacing.md,
                marginTop: spacing.md,
              }}
            >
              {currentStep > 1 ? (
                <Button type="button" variant="secondary" onClick={goBack}>
                  ← Précédent
                </Button>
              ) : (
                <span />
              )}

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={goNext}>
                  Suivant →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement..." : "✅ Enregistrer et continuer"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
