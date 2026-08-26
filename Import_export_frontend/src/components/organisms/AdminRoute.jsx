import { Navigate } from "react-router-dom";
import { useAdmin } from "../../features/admin/context/AdminContext";
import Spinner from "../atoms/Spinner";

export default function AdminRoute({ children }) {
  const { admin, isLoading } = useAdmin();

  if (isLoading) return <Spinner />;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return children;
}
