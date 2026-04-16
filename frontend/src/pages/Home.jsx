import { Link } from "react-router-dom";
import { isUserLoggedIn } from "../utils/auth.js";

const featureCards = [
  {
    title: "Smart Complaint Intake",
    description: "Collect location, issue details, and create a clean ticket instantly."
  },
  {
    title: "Auto Priority & Department",
    description: "Complaints are auto-grouped with a simple AI-style rules engine."
  },
  {
    title: "Admin Tracking Panel",
    description: "View all cases, filter quickly, and update progress from one place."
  },
  {
    title: "Citizen Dashboard",
    description: "Each logged-in user gets a personal complaint history and timeline."
  },
  {
    title: "Maps + Live Alerts",
    description: "Track location context, real-time updates, and notification-driven actions."
  }
];

function Home() {
  const userLoggedIn = isUserLoggedIn();

  return (
    <div className="home-layout">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <span className="hero-panel__badge">Advanced Citizen Grievance Portal</span>
          <h1>Raise complaints, route them smartly, and track progress in real time.</h1>
          <p>
            A cleaner MERN grievance platform with ticket IDs, auto categorization,
            priority scoring, map previews, live socket updates, notifications,
            and a responsive admin dashboard.
          </p>
          <div className="hero__actions">
            <Link to={userLoggedIn ? "/complaint" : "/login"} className="button">
              {userLoggedIn ? "Raise a Complaint" : "Login to Raise Complaint"}
            </Link>
            <Link to="/my-complaints" className="button button--ghost">
              View My Complaints
            </Link>
            <Link to="/dashboard" className="button button--secondary">
              Open Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="hero-panel__metrics">
          <div className="metric-card">
            <strong>3-Step Flow</strong>
            <span>Submit, assign, resolve</span>
          </div>
          <div className="metric-card">
            <strong>Smart Routing</strong>
            <span>Category + department hints</span>
          </div>
          <div className="metric-card">
            <strong>Live Dashboard</strong>
            <span>Auto-refresh every few seconds</span>
          </div>
          <div className="metric-card">
            <strong>User Complaint Portal</strong>
            <span>Personal ticket history for every citizen</span>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {featureCards.map((feature) => (
          <article key={feature.title} className="card feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Home;
