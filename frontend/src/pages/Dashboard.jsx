import { useEffect, useMemo, useState } from "react";
import {
  deleteComplaintAsAdmin,
  fetchComplaints,
  updateComplaintStatus
} from "../api/complaints.js";
import { io } from "socket.io-client";
import MapPanel from "../components/MapPanel.jsx";

const statusOptions = ["All", "Pending", "In Progress", "Resolved"];

function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const loadComplaints = async () => {
    try {
      const response = await fetchComplaints();
      setComplaints(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadComplaints();
    }, 8000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const socket = io("/", {
      path: "/socket.io"
    });

    socket.on("complaint:created", (payload) => {
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
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter;

      const searchSource = [
        complaint.ticketId,
        complaint.name,
        complaint.category,
        complaint.location,
        complaint.department
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchSource.includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [complaints, searchTerm, statusFilter]);

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

  const categoryStats = useMemo(() => {
    return complaints.reduce((result, complaint) => {
      const key = complaint.category || "General";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }, [complaints]);

  const priorityStats = useMemo(() => {
    return complaints.reduce((result, complaint) => {
      const key = complaint.priority || "Low";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }, [complaints]);

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);
      await updateComplaintStatus(id, status);
      await loadComplaints();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteComplaintAsAdmin(id);
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
          <span className="section-heading__eyebrow">Admin Panel</span>
          <h2>Complaint Control Center</h2>
          <p>Track tickets, filter by status, and move complaints through the workflow.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Tickets</span>
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

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Category Breakdown</h3>
            <div className="analytics-list">
              {Object.entries(categoryStats).map(([label, value]) => (
                <div key={label} className="analytics-row">
                  <div className="analytics-row__top">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="analytics-bar">
                    <span
                      style={{
                        width: `${(value / Math.max(stats.total, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <h3>Priority Split</h3>
            <div className="analytics-list">
              {Object.entries(priorityStats).map(([label, value]) => (
                <div key={label} className="analytics-row">
                  <div className="analytics-row__top">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="analytics-bar">
                    <span
                      style={{
                        width: `${(value / Math.max(stats.total, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <input
            type="text"
            className="toolbar__search"
            placeholder="Search by ticket ID, citizen, category, location..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="filter-pills">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                className={`pill ${statusFilter === status ? "pill--active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p>Loading complaints...</p> : null}
        {error ? <p className="message message--error">{error}</p> : null}

        {!loading && !error && filteredComplaints.length === 0 ? (
          <p>No complaints matched your current filters.</p>
        ) : null}

        {!loading && !error && filteredComplaints.length > 0 ? (
          <div className="complaints-list">
            {filteredComplaints.map((complaint) => (
              <article key={complaint._id} className="complaint-item">
                <div className="complaint-item__top">
                  <div>
                    <span className="ticket-badge">
                      {complaint.ticketId || "Legacy Ticket"}
                    </span>
                    <h3>{complaint.category || "General"}</h3>
                  </div>
                  <span className={`status-badge status-badge--${complaint.status.replace(/\s+/g, "-").toLowerCase()}`}>
                    {complaint.status}
                  </span>
                </div>

                <div className="complaint-grid">
                  <div>
                    <span className="meta-label">Citizen</span>
                    <p>{complaint.name}</p>
                  </div>
                  <div>
                    <span className="meta-label">Phone</span>
                    <p>{complaint.phone || "Not shared"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Location</span>
                    <p>{complaint.location || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Nearest City</span>
                    <p>{complaint.nearestCity || "Not shared"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Department</span>
                    <p>{complaint.department || "Public Grievance Cell"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Priority</span>
                    <p>{complaint.priority || "Low"}</p>
                  </div>
                  <div>
                    <span className="meta-label">Ward</span>
                    <p>{complaint.ward || "Not shared"}</p>
                  </div>
                </div>

                <p className="complaint-item__message">{complaint.message}</p>

                <div className="insight-box">
                  <span className="meta-label">AI Summary</span>
                  <p>{complaint.aiSummary || "Summary will appear for new complaints."}</p>
                </div>

                <div className="complaint-item__meta">
                  <span>{complaint.email}</span>
                  <span>{complaint.landmark || "No landmark added"}</span>
                  <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                </div>

                {complaint.attachmentUrl ? (
                  <a
                    href={complaint.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="attachment-link"
                  >
                    Open citizen attachment
                  </a>
                ) : null}

                <div className="status-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    Open Map + AI View
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

                <div className="status-actions">
                  {statusOptions.slice(1).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="button button--ghost"
                      disabled={
                        updatingId === complaint._id || complaint.status === status
                      }
                      onClick={() => handleStatusChange(complaint._id, status)}
                    >
                      {updatingId === complaint._id && complaint.status !== status
                        ? "Updating..."
                        : status}
                    </button>
                  ))}
                </div>

                <div className="timeline">
                  <span className="meta-label">Timeline</span>
                  <div className="timeline__list">
                    {(complaint.statusHistory || [
                      {
                        status: complaint.status,
                        note: "Imported from an older record.",
                        updatedAt: complaint.updatedAt || complaint.createdAt
                      }
                    ]).map((item, index) => (
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
        <h3>Admin Shortcuts</h3>
        <ul className="dashboard-sidepanel__list">
          <li>Filter by workflow stage</li>
          <li>See location and department routing</li>
          <li>Track ticket IDs and timeline updates</li>
          <li>Live socket updates plus auto refresh backup</li>
        </ul>

        <div className="sidepanel-note">
          <strong>Advanced update added</strong>
          <p>
            This version now behaves more like an admin complaint system, with
            smart routing and ticket tracking built in.
          </p>
        </div>

        {selectedComplaint ? (
          <div className="sidepanel-stack">
            <MapPanel complaint={selectedComplaint} title="Complaint Map" />
            <div className="analytics-card">
              <h3>AI Categorization</h3>
              <div className="analytics-list">
                <div className="analytics-row__top">
                  <span>Confidence</span>
                  <strong>{Math.round((selectedComplaint.aiCategoryConfidence || 0) * 100)}%</strong>
                </div>
                <div className="analytics-row__top">
                  <span>Sentiment</span>
                  <strong>{selectedComplaint.aiSentiment || "Normal concern"}</strong>
                </div>
                <div className="analytics-row__top">
                  <span>Recommended Action</span>
                  <strong>{selectedComplaint.aiRecommendedAction || "Track workflow"}</strong>
                </div>
              </div>
              {selectedComplaint.aiTags?.length ? (
                <div className="tag-row">
                  {selectedComplaint.aiTags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              ) : null}
              {selectedComplaint.aiUrgencyDrivers?.length ? (
                <div className="tag-row">
                  {selectedComplaint.aiUrgencyDrivers.map((driver) => (
                    <span key={driver} className="tag-chip tag-chip--warning">{driver}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default Dashboard;
