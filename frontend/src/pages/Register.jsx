import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth.js";
import { saveUserSession } from "../utils/auth.js";

const initialState = {
  name: "",
  email: "",
  password: ""
};

function Register() {
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
      const response = await registerUser(formData);
      saveUserSession(response.data);
      navigate("/complaint");
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="card auth-card">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Citizen Access</span>
          <h2>Create Your Account</h2>
          <p>Register with your email to submit complaints and manage password recovery.</p>
        </div>

        <form className="complaint-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>
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
              minLength="6"
              required
            />
          </label>

          {error ? <p className="message message--error">{error}</p> : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/user-login">Already have an account? Login</Link>
          <Link to="/login">Back to portal selection</Link>
        </div>
      </div>
    </section>
  );
}

export default Register;
