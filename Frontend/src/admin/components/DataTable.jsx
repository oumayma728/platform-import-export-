import { useState } from "react";


export default function DataTable({ columns = [], data = [], isLoading = false, emptyText = "Aucun résultat" }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }


  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const thStyle = (col) => ({
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#9ca3af",
    borderBottom: "1px solid #f0f0ee",
    whiteSpace: "nowrap",
    cursor: col.sortable !== false ? "pointer" : "default",
    userSelect: "none",
    background: "#fafaf9",
  });

  const tdStyle = {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#14161C",
    fontFamily: "'Inter', sans-serif",
    borderBottom: "1px solid #f7f7f5",
    verticalAlign: "middle",
  };

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: "10px",
        border: "1px solid #ebebea",
        background: "#fff",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={thStyle(col)}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {col.label}
                  {col.sortable !== false && (
                    <span style={{ opacity: sortKey === col.key ? 1 : 0.3, fontSize: "10px" }}>
                      {sortKey === col.key
                        ? sortDir === "asc" ? "↑" : "↓"
                        : "↕"}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Squelette de chargement
            Array.from({ length: 5 }).map((_, ri) => (
              <tr key={ri}>
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    <div
                      style={{
                        height: "14px",
                        borderRadius: "6px",
                        background: "linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.4s infinite",
                        width: `${55 + Math.random() * 35}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: "40px 16px",
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row, ri) => (
              <tr
                key={row.id ?? ri}
                style={{
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
