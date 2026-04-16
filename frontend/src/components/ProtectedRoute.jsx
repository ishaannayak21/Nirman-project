import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../utils/auth.js";

function ProtectedRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedRoute;
