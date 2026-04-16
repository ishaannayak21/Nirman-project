import { Navigate } from "react-router-dom";
import { isUserLoggedIn } from "../utils/auth.js";

function UserProtectedRoute({ children }) {
  if (!isUserLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default UserProtectedRoute;
