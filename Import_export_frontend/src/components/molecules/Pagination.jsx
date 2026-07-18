import { colors, radius, typography } from "../../styles/tokens";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Affiche au maximum 5 numéros de page, avec la page actuelle centrée
  // quand c'est possible.
  const pages = [];
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  function PageButton({ page, isActive, disabled, onClick, children }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          minWidth: 34,
          height: 34,
          padding: "0 8px",
          borderRadius: radius.sm,
          border: `1px solid ${isActive ? colors.primary : colors.border}`,
          backgroundColor: isActive ? colors.primary : "#fff",
          color: isActive ? "#fff" : disabled ? colors.border : colors.textPrimary,
          fontSize: typography.fontSizeSm,
          fontWeight: isActive ? 700 : 500,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {children ?? page}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
      <PageButton
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ←
      </PageButton>

      {start > 1 && (
        <>
          <PageButton page={1} onClick={() => onPageChange(1)} />
          {start > 2 && <span style={{ alignSelf: "center", color: colors.textMuted }}>…</span>}
        </>
      )}

      {pages.map((page) => (
        <PageButton
          key={page}
          page={page}
          isActive={page === currentPage}
          onClick={() => onPageChange(page)}
        />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ alignSelf: "center", color: colors.textMuted }}>…</span>}
          <PageButton page={totalPages} onClick={() => onPageChange(totalPages)} />
        </>
      )}

      <PageButton
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        →
      </PageButton>
    </div>
  );
}
