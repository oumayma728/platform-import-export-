
export default function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  }

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "32px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    textDecoration: "none",
    userSelect: "none",
  };

  const btnActive = {
    ...btnBase,
    background: "#14161C",
    color: "#fff",
    border: "1px solid #14161C",
    fontWeight: 600,
  };

  const btnDisabled = {
    ...btnBase,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        paddingTop: "16px",
        borderTop: "1px solid #f0f0ee",
      }}
    >
      {/* Infos résultats */}
      <span
        style={{
          fontSize: "13px",
          color: "#6b7280",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {from}–{to} sur{" "}
        <strong style={{ color: "#14161C" }}>{total}</strong> résultat
        {total > 1 ? "s" : ""}
      </span>

      {/* Contrôles */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {/* Précédent */}
        <button
          style={page === 1 ? btnDisabled : btnBase}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Page précédente"
        >
          ‹
        </button>

        {/* Numéros de page */}
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                ...btnBase,
                border: "none",
                cursor: "default",
                color: "#9ca3af",
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              style={p === page ? btnActive : btnBase}
              onClick={() => p !== page && onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Suivant */}
        <button
          style={page === totalPages ? btnDisabled : btnBase}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Page suivante"
        >
          ›
        </button>
      </div>
    </div>
  );
}
