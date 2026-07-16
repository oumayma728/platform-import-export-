import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors, radius, shadow, typography } from "../../styles/tokens";
import { useAuth } from "../../context/AuthContext";

export default function CategoryCard({ label, Icon, category, big, count }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    const query = `?category=${encodeURIComponent(category)}`;
    if (user) {
      // Connecté : on explore ses propres annonces par secteur.
      navigate(`/listings/mine${query}`);
    } else {
      navigate(`/listings${query}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        height: "100%",
        padding: big ? "36px 16px" : "28px 16px",
        borderRadius: radius.md,
        border: `1px solid ${hovered ? colors.primary : colors.border}`,
        backgroundColor: big ? colors.primarySoft : "#fff",
        boxShadow: hovered ? shadow.raised : shadow.card,
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.18s ease",
        fontFamily: typography.body,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      

      <Icon
        size={big ? 36 : 28}
        color={hovered ? colors.primary : colors.textPrimary}
        strokeWidth={1.75}
        style={{ transition: "color 0.18s ease" }}
      />
      <span style={{ fontSize: big ? typography.fontSizeMd : typography.fontSizeBase, fontWeight: 600, color: colors.textPrimary }}>
        {label}
      </span>

      {big && typeof count === "number" && count > 0 && (
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          {count} annonce{count > 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}