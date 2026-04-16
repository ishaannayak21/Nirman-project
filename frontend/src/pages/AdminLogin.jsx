import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin, verifyAdmin } from "../api/auth.js";
import {
  getAdminToken,
  saveAdminSession,
  clearAdminSession
} from "../utils/auth.js";

const initialState = {
  email: "admin@grievance.com",
  password: "admin123"
};

function AdminLogin() {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      return;
    }

    const validateSession = async () => {
      try {
        await verifyAdmin(token);
        navigate("/dashboard", { replace: true });
      } catch (sessionError) {
        clearAdminSession();
      }
    };

    validateSession();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginAdmin(formData);
      saveAdminSession(response.data);
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="card auth-card">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Admin Access</span>
          <h2>Login to Admin Panel</h2>
          <p>Use the admin account to view complaints and update ticket status.</p>
        </div>

        <form className="complaint-form" onSubmit={handleSubmit}>
          <label>
            Admin Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          {error ? <p className="message message--error">{error}</p> : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <div className="auth-help">
          <strong>Default credentials</strong>
          <p>Email: `admin@grievance.com`</p>
          <p>Password: `admin123`</p>
        </div>

        <div className="auth-links">
          <Link to="/login">Back to portal selection</Link>
          <Link to="/user-login">Go to user portal</Link>
        </div>
      </div>
    </section>
  );
}

export default AdminLogin;
