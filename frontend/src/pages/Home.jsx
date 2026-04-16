import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isUserLoggedIn } from "../utils/auth.js";
import { fetchPublicStats } from "../api/complaints.js";

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
  const [stats, setStats] = useState({ 
    total: 0, 
    resolved: 0, 
    pending: 0, 
    topCategory: "General", 
    highPriorityAlerts: 0, 
    duplicatesPrevented: 0 
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchPublicStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Silently failing stats load:", err);
      }
    };
    loadStats();
  }, []);

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
            <strong>{stats.total} Total Issues</strong>
            <span>Complaints logged so far</span>
          </div>
          <div className="metric-card">
            <strong>{stats.resolved} Resolved</strong>
            <span>Successfully closed tickets</span>
          </div>
          <div className="metric-card">
            <strong>{stats.pending} Pending</strong>
            <span>In active workflow pipeline</span>
          </div>
          <div className="metric-card">
            <strong>Top: {stats.topCategory}</strong>
            <span>Most common grievance type</span>
          </div>
        </div>

        <div style={{ marginTop: '25px', padding: '15px 20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '15px', color: '#cbd5e1', fontSize: '0.95rem' }}>
           <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>🧠 Regional Insights:</span>
           <span>🔥 Top Issue This Week: <strong style={{ color: 'white' }}>{stats.topCategory}</strong></span>
           <span>⚠️ High Priority Alerts: <strong style={{ color: '#ef4444' }}>{stats.highPriorityAlerts}</strong></span>
           <span>🛡️ Duplicates Prevented: <strong style={{ color: '#10b981' }}>{stats.duplicatesPrevented}</strong></span>
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
