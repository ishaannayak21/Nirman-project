import { NavLink, useNavigate } from "react-router-dom";
import NotificationCenter from "./NotificationCenter.jsx";
import {
  clearAdminSession,
  clearUserSession,
  isAdminLoggedIn,
  isUserLoggedIn
} from "../utils/auth.js";

function Navbar({ liveNotifications = [] }) {
  const navigate = useNavigate();
  const adminLoggedIn = isAdminLoggedIn();
  const userLoggedIn = isUserLoggedIn();

  const handleAdminLogout = () => {
    clearAdminSession();
    navigate("/admin-login");
  };

  const handleUserLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__eyebrow">Citizen Support Portal</span>
        <span>Grievance Intelligence Platform</span>
      </div>
      <nav className="navbar__links">
        <NotificationCenter liveNotifications={liveNotifications} />
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/complaint" className="nav-link">
          Complaint Form
        </NavLink>
        {userLoggedIn ? (
          <>
            <NavLink to="/my-complaints" className="nav-link">
              My Complaints
            </NavLink>
            <button type="button" className="nav-link nav-link--button" onClick={handleUserLogout}>
              User Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
            <NavLink to="/register" className="nav-link">
              Register
            </NavLink>
          </>
        )}
        {adminLoggedIn ? (
          <NavLink to="/dashboard" className="nav-link">
            Admin Dashboard
          </NavLink>
        ) : null}
        {adminLoggedIn ? (
          <button type="button" className="nav-link nav-link--button" onClick={handleAdminLogout}>
            Admin Logout
          </button>
        ) : null}
      </nav>
    </header>
  );
}

export default Navbar;
