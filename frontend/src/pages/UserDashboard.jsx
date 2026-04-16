import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import {
  deleteMyComplaint,
  fetchMyComplaints
} from "../api/complaints.js";
import MapPanel from "../components/MapPanel.jsx";
import { getUser } from "../utils/auth.js";

function UserDashboard() {
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const response = await fetchMyComplaints();
        setComplaints(response.data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  useEffect(() => {
    const socket = io("/", {
      path: "/socket.io"
    });

    socket.on("complaint:created", (payload) => {
      if (payload.user && payload.user !== user?.id) {
        return;
      }

      setComplaints((current) => {
        const merged = [payload, ...current];
        return merged.filter(
          (item, index, array) =>
            array.findIndex((candidate) => candidate._id === item._id) === index
        );
      });
    });

    socket.on("complaint:updated", (payload) => {
      setComplaints((current) =>
        current.map((item) => (item._id === payload._id ? payload : item))
      );
      setSelectedComplaint((current) =>
        current && current._id === payload._id ? payload : current
      );
    });

    socket.on("complaint:deleted", (payload) => {
      setComplaints((current) => current.filter((item) => item._id !== payload._id));
      setSelectedComplaint((current) =>
        current && current._id === payload._id ? null : current
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((complaint) => complaint.status === "Pending")
        .length,
      inProgress: complaints.filter(
        (complaint) => complaint.status === "In Progress"
      ).length,
      resolved: complaints.filter((complaint) => complaint.status === "Resolved")
        .length
    };
  }, [complaints]);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteMyComplaint(id);
      setComplaints((current) => current.filter((item) => item._id !== id));
      setSelectedComplaint((current) => (current && current._id === id ? null : current));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="dashboard-layout">
      <section className="card dashboard-panel">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Citizen Dashboard</span>
          <h2>My Complaints</h2>
          <p>
            Track only your own complaints, follow the current status, and review
            ticket history.
          </p>
          {user ? <p className="auth-inline-note">Signed in as {user.email}</p> : null}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Raised</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
          <div className="stat-card">
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
          <div className="stat-card">
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>
        </div>

        {loading ? <p>Loading your complaints...</p> : null}
        {error ? <p className="message message--error">{error}</p> : null}

        {!loading && !error && complaints.length === 0 ? (
          <div className="empty-state">
            <p>You have not submitted any complaints yet.</p>
            <Link to="/complaint" className="button">
              Submit Your First Complaint
            </Link>
          </div>
        ) : null}

        {!loading && !error && complaints.length > 0 ? (
          <div className="complaints-list">
            {complaints.map((complaint) => (
              <article key={complaint._id} className="complaint-item">
                <div className="complaint-item__top">
                  <div>
                    <span className="ticket-badge">{complaint.ticketId}</span>
                    <h3>{complaint.category}</h3>
                  </div>
                  <span
                    className={`status-badge status-badge--${complaint.status
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                  >
                    {complaint.status}
                  </span>
                </div>

                <div className="complaint-grid">
                  <div>
                    <span className="meta-label">Location</span>
                    <p>{complaint.location}</p>
                  </div>
                  <div>
                    <span className="meta-label">Nearest City</span>
                    <p>{complaint.nearestCity || "Not shared"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Ward</span>
                    <p>{complaint.ward || "Not shared"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Department</span>
                    <p>{complaint.department}</p>
                  </div>
                  <div>
                    <span className="meta-label">Priority</span>
                    <p>{complaint.priority}</p>
                  </div>
                </div>

                <p className="complaint-item__message">{complaint.message}</p>

                {complaint.attachmentUrl ? (
                  <a
                    href={complaint.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="attachment-link"
                  >
                    View attachment
                  </a>
                ) : null}

                <div className="status-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    Open Map View
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    disabled={deletingId === complaint._id}
                    onClick={() => handleDelete(complaint._id)}
                  >
                    {deletingId === complaint._id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <div className="timeline">
                  <span className="meta-label">Status Timeline</span>
                  <div className="timeline__list">
                    {(complaint.statusHistory || []).map((item, index) => (
                      <div key={`${item.status}-${index}`} className="timeline__item">
                        <strong>{item.status}</strong>
                        <span>{item.note}</span>
                        <small>{new Date(item.updatedAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <aside className="card dashboard-sidepanel">
        <h3>Citizen Tools</h3>
        <ul className="dashboard-sidepanel__list">
          <li>See only your submitted tickets</li>
          <li>Track each status stage clearly</li>
          <li>Open attachments you uploaded</li>
          <li>Receive live status updates and notifications</li>
        </ul>

        <div className="sidepanel-note">
          <strong>Advanced citizen portal</strong>
          <p>
            This user area now gives every registered citizen a personal complaint
            tracker instead of a one-page public form.
          </p>
        </div>

        {selectedComplaint ? (
          <div className="sidepanel-stack">
            <MapPanel complaint={selectedComplaint} title="Complaint Map" />
            <div className="analytics-card">
              <h3>AI Insight Summary</h3>
              <p>{selectedComplaint.aiSummary}</p>
              {selectedComplaint.aiRecommendedAction ? (
                <p className="auth-inline-note">{selectedComplaint.aiRecommendedAction}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default UserDashboard;
