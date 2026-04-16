import { Link } from "react-router-dom";

function PortalSelect() {
  return (
    <section className="auth-shell">
      <div className="portal-select">
        <div className="card portal-select__intro">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Access Control</span>
            <h2>Choose Your Portal</h2>
            <p>
              Citizens and administrators now have separate entry points. Users
              can continue through the citizen portal, while admins can enter the
              secure control center directly.
            </p>
          </div>
        </div>

        <div className="portal-select__grid">
          <article className="card portal-card">
            <span className="portal-card__tag">User Portal</span>
            <h3>Citizen Access</h3>
            <p>
              Login, register, track your complaints, and manage your password
              without seeing any admin-only tools.
            </p>
            <div className="portal-card__actions">
              <Link to="/user-login" className="button">
                Open User Portal
              </Link>
              <Link to="/register" className="button button--ghost">
                Create Account
              </Link>
            </div>
          </article>

          <article className="card portal-card portal-card--admin">
            <span className="portal-card__tag">Admin Portal</span>
            <h3>Administrative Access</h3>
            <p>
              Secure entry for administrators to review tickets, analytics,
              notifications, workflow updates, and live complaint activity.
            </p>
            <div className="portal-card__actions">
              <Link to="/admin-login" className="button button--secondary">
                Open Admin Portal
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default PortalSelect;
