import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setResetUrl("");

    try {
      const response = await forgotPassword({ email });
      setSuccess(response.message);
      setResetUrl(response.data?.resetUrl || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="card auth-card">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Password Recovery</span>
          <h2>Forgot Password</h2>
          <p>Enter your email and we will send a reset link.</p>
        </div>

        <form className="complaint-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          {error ? <p className="message message--error">{error}</p> : null}
          {success ? <p className="message message--success">{success}</p> : null}
          {resetUrl ? (
            <div className="auth-help">
              <strong>Local testing reset link</strong>
              <p className="auth-link-preview">{resetUrl}</p>
            </div>
          ) : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/user-login">Back to user login</Link>
          <Link to="/login">Back to portal selection</Link>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
