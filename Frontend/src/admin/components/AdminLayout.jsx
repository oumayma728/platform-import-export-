import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";


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
