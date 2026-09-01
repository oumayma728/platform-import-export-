import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/molecules/StatusBadge";
import SectionCard from "../components/molecules/SectionCard";
import CompanyLogoUpload from "../components/molecules/CompanyLogoUpload";
import Reveal from "../components/atoms/Reveal";
import Input from "../components/atoms/Input";
import Select from "../components/atoms/Select";
import Button from "../components/atoms/Button";
import { completeProfile, uploadCompanyLogo, changePassword } from "../api/auth";
import { colors, spacing, typography } from "../styles/tokens";
import { toRoleArray, ROLE_LABEL } from "../utils/roles";

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
    role: toRoleArray(user?.type_compte ?? user?.role).length > 0
      ? toRoleArray(user?.type_compte ?? user?.role)
      : ["exporter"],
  });
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountSaveError, setAccountSaveError] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companySaveError, setCompanySaveError] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    companyName: user?.profile?.companyName || user?.entreprise || "",
    country: user?.profile?.country || user?.pays || "",
    sector: user?.profile?.sector || "",
    certifications: Array.isArray(user?.profile?.certifications)
      ? user.profile.certifications.join(", ")
      : user?.profile?.certifications || "",
    description: user?.profile?.description || "",
  });

  useEffect(() => {
    if (!user) return;
    setAccountInfo({
      email: user.email || "",
      phone: user.phone || user.telephone || "",
      role: toRoleArray(user.type_compte ?? user.role).length > 0
        ? toRoleArray(user.type_compte ?? user.role)
        : ["exporter"],
    });
    setCompanyInfo({
      companyName: user.profile?.companyName || user.entreprise || "",
      country: user.profile?.country || user.pays || "",
      sector: user.profile?.sector || "",
      certifications: Array.isArray(user.profile?.certifications)
        ? user.profile.certifications.join(", ")
        : user.profile?.certifications || "",
      description: user.profile?.description || "",
    });
    setLogoUrl(user.profile?.logoUrl || null);
  }, [user]);

  async function handleAccountSave() {
    setAccountSaveError("");
    setAccountSaved(false);
    setIsSavingAccount(true);

    try {
      const payload = {
        email: accountInfo.email.trim(),
        telephone: accountInfo.phone?.trim() || null,
        // Envoi explicite de la source de vérité backend.
        // On évite ainsi toute ambiguïté entre role et type_compte.
        type_compte: accountInfo.role,
      };

      // Persistance réelle via PUT /api/auth/profile.
      const updated = await completeProfile(payload);

      // Le contexte est mis à jour avec la réponse réelle du backend.
      updateUser(updated);

      // On réaligne aussi explicitement l'état local sur la réponse persistée.
      // Cela évite qu'un useEffect ou une ancienne valeur du contexte ne remette
      // immédiatement le rôle précédent à l'écran.
      const persistedRoles = toRoleArray(updated?.type_compte ?? updated?.role);
      setAccountInfo((prev) => ({
        ...prev,
        email: updated?.email || prev.email,
        phone: updated?.telephone ?? updated?.phone ?? prev.phone,
        role: persistedRoles.length > 0 ? persistedRoles : prev.role,
      }));

      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 2500);
    } catch (err) {
      console.error("Erreur modification compte :", err);
      setAccountSaveError(
        err?.message || "Impossible d'enregistrer les modifications du compte."
      );
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleCompanySave() {
    setCompanySaveError("");
    setCompanySaved(false);
    setIsSavingCompany(true);
    try {
      const payload = {
        companyName: companyInfo.companyName.trim(),
        country: companyInfo.country || null,
        sector: companyInfo.sector || null,
        certifications: companyInfo.certifications
          ? companyInfo.certifications.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        description: companyInfo.description?.trim() || null,
      };
      const updated = await completeProfile(payload);
      updateUser(updated);
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2500);
    } catch (err) {
      setCompanySaveError(err.message || "Impossible d'enregistrer les informations entreprise.");
    } finally {
      setIsSavingCompany(false);
    }
  }

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
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.currentPassword) {
      setPasswordError("Saisissez votre mot de passe actuel.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins une majuscule.");
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins un chiffre.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("Le nouveau mot de passe doit être différent du mot de passe actuel.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(passwordData);
      setPasswordSuccess(result?.message || "Mot de passe modifié avec succès.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || "Impossible de modifier le mot de passe.");
    } finally {
      setIsChangingPassword(false);
    }
  }

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
                <Button onClick={handleAccountSave} disabled={isSavingAccount}>
                  {isSavingAccount ? "Enregistrement..." : "Enregistrer"}
                </Button>
                {accountSaved && (
                  <span style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>
                    ✅ Modifications enregistrées
                  </span>
                )}
                {accountSaveError && (
                  <span style={{ color: colors.danger, fontSize: 13, fontWeight: 600 }}>
                    ⚠️ {accountSaveError}
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

              <div style={{ marginTop: spacing.sm, display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
                <Button onClick={handleCompanySave} disabled={isSavingCompany}>
                  {isSavingCompany ? "Enregistrement..." : "Enregistrer"}
                </Button>
                {companySaved && (
                  <span style={{ color: colors.success, fontSize: 13, fontWeight: 600 }}>
                    ✅ Informations entreprise enregistrées
                  </span>
                )}
                {companySaveError && (
                  <span style={{ color: colors.danger, fontSize: 13, fontWeight: 600 }}>
                    ⚠️ {companySaveError}
                  </span>
                )}
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

              {passwordError && (
                <p
                  style={{
                    margin: "0 0 12px",
                    color: colors.danger,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p
                  style={{
                    margin: "0 0 12px",
                    color: colors.success,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ✅ {passwordSuccess}
                </p>
              )}

              <div>
                <Button
                  variant="dark"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Modification..." : "Changer le mot de passe"}
                </Button>
              </div>
            </SectionCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}