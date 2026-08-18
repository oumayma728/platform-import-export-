import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

/**
 * Layout principal de l'espace admin.
 * Sidebar fixe à gauche + zone de contenu scrollable à droite.
 * Complètement séparé du RootLayout utilisateur.
 */
export default function AdminLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F6F5F2",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <AdminSidebar />

      {/* Zone de contenu principal */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
