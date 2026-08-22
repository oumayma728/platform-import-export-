import { useForm } from "react-hook-form";
import { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import FormField from "../components/molecules/FormField";
import Textarea from "../components/atoms/Textarea";
import Button from "../components/atoms/Button";
import { colors, radius, shadow, spacing, typography } from "../styles/tokens";

const CONTACT_ITEMS = [
  { Icon: MapPin, value: "Bizerte, Tunisie" },
  { Icon: Mail, value: "contact.indeed2@gmail.com" },
  { Icon: Phone, value: "+216 12-345-678" },
];

function InfoCard({ Icon, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: "#fff",
          boxShadow: shadow.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={colors.primary} strokeWidth={2} />
      </div>
      <span style={{ fontSize: typography.fontSizeBase, color: colors.textPrimary, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [sent, setSent] = useState(false);

  function onSubmit() {
    // Pas de backend pour ce module — confirmation locale uniquement
    setSent(true);
  }

  return (
    <div
      style={{
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        width: "100vw",
        padding: `${spacing.xl}px ${spacing.xl}px ${spacing.xxl}px`,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: 34,
            fontWeight: 800,
            color: colors.textPrimary,
            marginBottom: spacing.xl,
          }}
        >
          Contactez-nous pour toute question
        </h1>

        {/* Cartes d'info — localisation, email, téléphone */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: spacing.md,
            marginBottom: spacing.xl,
          }}
        >
          {CONTACT_ITEMS.map((item) => (
            <InfoCard key={item.value} {...item} />
          ))}
        </div>

        {/* Carte + formulaire */}
        <div
          className="grid-2-col"
          style={{
            gap: spacing.lg,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              borderRadius: radius.md,
              overflow: "hidden",
              boxShadow: shadow.card,
              minHeight: 460,
            }}
          >
            <iframe
              title="Localisation bizerte, Tunisie"
              src="https://www.google.com/maps?q=bizerte,Tunisie&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 460 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: colors.textPrimary, marginBottom: spacing.md }}>
              Réclamation
            </h2>

            {sent ? (
              <div
                style={{
                  backgroundColor: colors.successBg,
                  color: colors.success,
                  borderRadius: radius.sm,
                  padding: spacing.md,
                  fontSize: typography.fontSizeBase,
                  fontWeight: 600,
                }}
              >
                Message envoyé — merci, nous revenons vers vous très vite.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid-2-col" style={{ gap: spacing.md }}>
                  <FormField
                    label=""
                    name="name"
                    placeholder="Votre nom"
                    register={register}
                    rules={{ required: "Nom requis" }}
                    error={errors.name}
                  />
                  <FormField
                    label=""
                    name="email"
                    type="email"
                    placeholder="Votre email"
                    register={register}
                    rules={{ required: "Email requis" }}
                    error={errors.email}
                  />
                </div>
                <FormField
                  label=""
                  name="subject"
                  placeholder="Sujet"
                  register={register}
                  rules={{ required: "Sujet requis" }}
                  error={errors.subject}
                />
                <Textarea
                  name="message"
                  placeholder="Message"
                  register={register}
                  rows={6}
                  error={errors.message}
                />
                <div style={{ marginTop: spacing.sm }}>
                  <Button type="submit" fullWidth>Envoyer le message</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
