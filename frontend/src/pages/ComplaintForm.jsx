import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitComplaint } from "../api/complaints.js";
import { getUser } from "../utils/auth.js";
import MapPanel from "../components/MapPanel.jsx";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  category: "",
  location: "",
  nearestCity: "",
  ward: "",
  landmark: "",
  attachmentUrl: "",
  message: ""
};

function ComplaintForm() {
  const user = getUser();
  const [formData, setFormData] = useState({
    ...initialForm,
    name: user?.name || "",
    email: user?.email || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    setSuccessMessage("");

    try {
      await submitComplaint(formData);
      setSuccessMessage("Complaint submitted successfully.");
      setFormData({
        ...initialForm,
        name: user?.name || "",
        email: user?.email || ""
      });

      setTimeout(() => {
        navigate(user ? "/my-complaints" : "/dashboard");
      }, 800);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card form-card">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Citizen Form</span>
        <h2>Submit a Grievance</h2>
        <p>
          Add the issue details below. The system will generate a ticket ID,
          priority level, and department suggestion automatically.
        </p>
        {user ? <p className="auth-inline-note">Logged in as {user.email}</p> : null}
      </div>

      <form className="complaint-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />
        </label>

        <label>
          Issue Type
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Water">Water Supply</option>
            <option value="Electricity">Electricity</option>
            <option value="Road">Roads</option>
            <option value="Garbage">Sanitation</option>
            <option value="General">General Issue</option>
          </select>
        </label>

        <label>
          Location
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Example: Gandhi Nagar, Ward 12"
            required
          />
        </label>

        <label>
          Nearest City
          <input
            type="text"
            name="nearestCity"
            value={formData.nearestCity}
            onChange={handleChange}
            placeholder="Example: Hyderabad"
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Ward / Area Code
            <input
              type="text"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              placeholder="Example: Ward 12"
            />
          </label>

          <label>
            Landmark
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="Example: Near bus stop"
            />
          </label>
        </div>

        <label>
          Attachment URL
          <input
            type="url"
            name="attachmentUrl"
            value={formData.attachmentUrl}
            onChange={handleChange}
            placeholder="Paste image or document link (optional)"
          />
        </label>

        <MapPanel
          title="Live Location Preview"
          complaint={{
            location: formData.location,
            nearestCity: formData.nearestCity,
            ward: formData.ward,
            landmark: formData.landmark
          }}
        />

        <label>
          Message
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Describe your grievance"
            rows="5"
            required
          />
        </label>

        {error ? <p className="message message--error">{error}</p> : null}
        {successMessage ? (
          <p className="message message--success">{successMessage}</p>
        ) : null}

        <div className="form-highlight">
          <strong>Advanced intake enabled</strong>
          <p>
            New complaints now capture optional contact details, location hints,
            attachment links, and live map context for faster processing.
          </p>
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </section>
  );
}

export default ComplaintForm;
