import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth.js";
import { saveUserSession } from "../utils/auth.js";

const initialState = {
  email: "",
  password: ""
};

function UserLogin() {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await loginUser(formData);
      saveUserSession(response.data);
      navigate("/complaint");
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
          <span className="section-heading__eyebrow">Citizen Access</span>
          <h2>Login to Your Account</h2>
          <p>Login to continue with complaint submission and account recovery.</p>
        </div>

        <form className="complaint-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create a new account</Link>
          <Link to="/login">Back to portal selection</Link>
        </div>
      </div>
    </section>
  );
}

export default UserLogin;
