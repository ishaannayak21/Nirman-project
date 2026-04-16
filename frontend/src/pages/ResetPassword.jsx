import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword, validateResetToken } from "../api/auth.js";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      try {
        await validateResetToken(token);
        setIsLinkValid(true);
      } catch (validationError) {
        setError(validationError.message);
        setIsLinkValid(false);
      } finally {
        setCheckingLink(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await resetPassword(token, { password });
      setSuccess(response.message);
      setTimeout(() => {
        navigate("/user-login");
      }, 1200);
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="card auth-card">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Password Recovery</span>
          <h2>Reset Password</h2>
          <p>Enter your new password below. Reset links stay active for 1 hour.</p>
        </div>

        {checkingLink ? <p>Checking reset link...</p> : null}
        {error ? <p className="message message--error">{error}</p> : null}
        {success ? <p className="message message--success">{success}</p> : null}

        {!checkingLink && isLinkValid ? (
          <form className="complaint-form" onSubmit={handleSubmit}>
            <label>
              New Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength="6"
                required
              />
            </label>

            <button type="submit" className="button" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        ) : null}

        <div className="auth-links">
          <Link to="/user-login">Back to user login</Link>
          <Link to="/login">Back to portal selection</Link>
          {!isLinkValid ? <Link to="/forgot-password">Send new reset link</Link> : null}
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
