import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/molecules/StatusBadge";
import SectionCard from "../components/molecules/SectionCard";
import CompanyLogoUpload from "../components/molecules/CompanyLogoUpload";
import Reveal from "../components/atoms/Reveal";
import Input from "../components/atoms/Input";
import Select from "../components/atoms/Select";
import Button from "../components/atoms/Button";
import { uploadCompanyLogo } from "../api/auth";
import { colors, spacing, typography } from "../styles/tokens";
import { toRoleArray, ROLE_LABEL } from "../utils/roles";

const COUNTRY_OPTIONS = [
  "Tunisie",
  "France",
  "Maroc",
  "Algérie",
  "Égypte",
  "Chine",
  "Italie",
  "Espagne",
].map((c) => ({ value: c, label: c }));

const SECTOR_OPTIONS = [
  "Agroalimentaire",
  "Textile",
  "Industrie",
  "Énergie",
  "Chimie",
  "Cosmétique",
].map((s) => ({ value: s, label: s }));

const ROLE_OPTIONS = [
  { value: "exporter", label: "Exportateur" },
  { value: "importer", label: "Importateur" },
];

function FieldLabel({ children }) {
  return (
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
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [accountInfo, setAccountInfo] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    role: toRoleArray(user?.role).length > 0 ? toRoleArray(user?.role) : ["exporter"],
  });
  const [accountSaved, setAccountSaved] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    companyName: user?.profile?.companyName || "Olive Tunisia",
    country: user?.profile?.country || "",
    sector: user?.profile?.sector || "",
    certifications: user?.profile?.certifications?.join(", ") || "",
  });

  const [logoUrl, setLogoUrl] = useState(user?.profile?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");

  async function handleLogoSelected(file) {
    setLogoUploadError("");
    setIsUploadingLogo(true);
    try {
      const { logoUrl: uploadedUrl } = await uploadCompanyLogo(file);
      setLogoUrl(uploadedUrl);
      // Persisté immédiatement dans le contexte d'auth : le logo devient
      // aussitôt disponible partout dans l'app (ex: avatar messagerie),
      // sans attendre le clic sur "Enregistrer" du formulaire entreprise.
      updateUser({ profile: { ...user?.profile, logoUrl: uploadedUrl } });
    } catch (err) {
      setLogoUploadError(err.message || "Échec de l'envoi du logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <Reveal style={{ marginBottom: spacing.lg }}>
        <span className="eyebrow">Mon compte</span>
        <h1
          style={{
            fontFamily: typography.display,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: colors.textPrimary,
            marginBottom: "10px",
          }}
        >
          Modifier mon profil
        </h1>
        <p style={{ color: colors.textMuted, fontFamily: typography.body }}>
          Gérez votre compte, votre entreprise et vos paramètres de sécurité.
        </p>
      </Reveal>

      <div className="grid-sidebar" style={{ gap: spacing.lg, alignItems: "start" }}>
        {/* SIDEBAR */}
        <Reveal delay={80}>
          <div
            style={{
              background: colors.surfaceRaised,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: spacing.lg,
              textAlign: "center",
              position: "sticky",
              top: spacing.lg,
            }}
          >
            <CompanyLogoUpload
              logoUrl={logoUrl}
              companyName={companyInfo.companyName}
              onFileSelected={handleLogoSelected}
              isUploading={isUploadingLogo}
            />
            {logoUploadError && (
              <p
                style={{
                  color: colors.danger,
                  fontFamily: typography.body,
                  fontSize: 12,
                  marginTop: -8,
                  marginBottom: 12,
                }}
              >
                ⚠️ {logoUploadError}
              </p>
            )}

            <h3
              style={{
                fontFamily: typography.display,
                fontSize: 18,
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              {companyInfo.companyName}
            </h3>

            <p style={{ color: colors.textMuted, fontFamily: typography.body, fontSize: 14, marginBottom: 12 }}>
              {accountInfo.role.map((r) => ROLE_LABEL[r] || r).join(" & ")}
            </p>

            <StatusBadge status={user?.profileStatus || "pending"} />

            <div style={{ marginTop: 14 }}>
              <Link
                to="/profile/status"
                style={{
                  fontFamily: typography.body,
                  fontSize: 13,
                  color: colors.primary,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Voir le détail du statut →
              </Link>
            </div>
          </div>
        </Reveal>

        {/* CONTENU */}
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Reveal delay={140}>
            <SectionCard title="Compte professionnel">
              <FieldLabel>Email professionnel</FieldLabel>
              <Input
                type="email"
                value={accountInfo.email}
                onChange={(e) => setAccountInfo({ ...accountInfo, email: e.target.value })}
              />

              <FieldLabel>Téléphone professionnel</FieldLabel>
              <Input
                value={accountInfo.phone}
                onChange={(e) => setAccountInfo({ ...accountInfo, phone: e.target.value })}
              />

              <FieldLabel>Type de compte</FieldLabel>
              <p style={{ color: colors.textMuted, fontSize: 13, marginTop: -4, marginBottom: 10 }}>
                Vous pouvez cocher les deux si vous importez certains produits et en exportez d'autres.
              </p>
              <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.sm }}>
                {ROLE_OPTIONS.map((option) => {
                  const isChecked = accountInfo.role.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        border: `1px solid ${isChecked ? colors.primary : colors.border}`,
                        borderRadius: 10,
                        backgroundColor: isChecked ? "#FBF0DC" : "#fff",
                        cursor: "pointer",
                        fontFamily: typography.body,
                        fontSize: 14,
                        fontWeight: isChecked ? 700 : 500,
                        color: colors.textPrimary,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? accountInfo.role.filter((r) => r !== option.value)
                            : [...accountInfo.role, option.value];
                          // Au moins un rôle doit rester sélectionné
                          if (next.length > 0) {
                            setAccountInfo({ ...accountInfo, role: next });
                          }
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>

              <div style={{ marginTop: spacing.sm, display: "flex", alignItems: "center", gap: spacing.sm }}>
                <Button
                  onClick={() => {
                    updateUser({
                      email: accountInfo.email,
                      phone: accountInfo.phone,
                      role: accountInfo.role,
                    });
                    setAccountSaved(true);
                    setTimeout(() => setAccountSaved(false), 2500);
                  }}
                >
                  Enregistrer
                </Button>
                {accountSaved && (
                  <span style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>
                    ✅ Modifications enregistrées
                  </span>
                )}
              </div>
            </SectionCard>
          </Reveal>

          <Reveal delay={200}>
            <SectionCard title="Informations entreprise">
              <FieldLabel>Nom de l'entreprise</FieldLabel>
              <Input
                value={companyInfo.companyName}
                onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
              />

              <div className="grid-2-col" style={{ gap: spacing.md }}>
                <div>
                  <FieldLabel>Pays</FieldLabel>
                  <Select
                    value={companyInfo.country}
                    options={COUNTRY_OPTIONS}
                    placeholder="Sélectionner un pays"
                    onChange={(value) => setCompanyInfo({ ...companyInfo, country: value })}
                  />
                </div>
                <div>
                  <FieldLabel>Secteur</FieldLabel>
                  <Select
                    value={companyInfo.sector}
                    options={SECTOR_OPTIONS}
                    placeholder="Sélectionner un secteur"
                    onChange={(value) => setCompanyInfo({ ...companyInfo, sector: value })}
                  />
                </div>
              </div>

              <FieldLabel>Certifications</FieldLabel>
              <Input
                value={companyInfo.certifications}
                onChange={(e) => setCompanyInfo({ ...companyInfo, certifications: e.target.value })}
              />

              <div style={{ marginTop: spacing.sm }}>
                <Button>Enregistrer</Button>
              </div>
            </SectionCard>
          </Reveal>

          <Reveal delay={260}>
            <SectionCard title="Sécurité">
              <FieldLabel>Mot de passe actuel</FieldLabel>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />

              <FieldLabel>Nouveau mot de passe</FieldLabel>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />

              <FieldLabel>Confirmer le mot de passe</FieldLabel>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />

              <Link
                to="/forgot-password"
                style={{
                  display: "inline-block",
                  margin: "4px 0 16px",
                  color: colors.primary,
                  fontFamily: typography.body,
                  fontSize: 14,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Mot de passe oublié ?
              </Link>

              <div>
                <Button variant="dark">Changer le mot de passe</Button>
              </div>
            </SectionCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}