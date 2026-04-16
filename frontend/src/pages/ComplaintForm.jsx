import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { submitComplaint, analyzeComplaint, checkDuplicateComplaint, supportComplaint, uploadComplaintImage } from "../api/complaints.js";
import { getUser } from "../utils/auth.js";
import MapPanel from "../components/MapPanel.jsx";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  category: "",
  location: "",
  lat: null,
  lng: null,
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
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [detectedCategory, setDetectedCategory] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateActionLoading, setDuplicateActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.message.length > 10) {
        setIsAnalyzing(true);
        try {
          const res = await analyzeComplaint(formData.message);
          if (res.success && res.data) {
            setDetectedCategory(res.data.category);
            setFormData(prev => ({ ...prev, category: res.data.category }));
          }
        } catch (e) {
          console.error("AI Analysis failed", e);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.message]);

  const handleLocationFetch = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setFetchingLocation(true);
    setLocationError("");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          let readableLocation = data.display_name || "Unknown Location";
          
          let nearestCity = formData.nearestCity;
          if (data.address) {
            nearestCity = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || nearestCity;
          }

          let ward = formData.ward;
          if (data.address && data.address.suburb) {
            ward = data.address.suburb;
          }

          setFormData(prev => ({ 
            ...prev, 
            location: readableLocation,
            lat: latitude,
            lng: longitude,
            nearestCity: nearestCity || prev.nearestCity,
            category: prev.category || "General"
          }));
        } catch (err) {
          setLocationError("Unable to fetch location details.");
        } finally {
          setFetchingLocation(false);
        }
      },
      () => {
        setLocationError("Unable to fetch location. Please allow permission.");
        setFetchingLocation(false);
      }
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
         setError("Please upload a valid image file (JPG/PNG).");
         return;
      }
      if (file.size > 5 * 1024 * 1024) {
         setError("Image size must be less than 5MB.");
         return;
      }
      setUploadFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSupportExisting = async () => {
    if (!duplicateWarning?.existingComplaint) return;
    setDuplicateActionLoading(true);
    try {
      await supportComplaint(duplicateWarning.existingComplaint._id);
      setSuccessMessage("You have successfully supported the existing complaint!");
      setDuplicateWarning(null);
      setTimeout(() => navigate(user ? "/my-complaints" : "/dashboard"), 2000);
    } catch (err) {
      setError("Failed to support existing complaint.");
      setDuplicateActionLoading(false);
    }
  };

  const executeSubmit = async (overrideDuplicate = false) => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    if (overrideDuplicate) setDuplicateWarning(null);

    try {
      if (!overrideDuplicate && formData.message) {
         try {
           const dupRes = await checkDuplicateComplaint({ message: formData.message, lat: formData.lat, lng: formData.lng });
           if (dupRes.success && dupRes.duplicate) {
              setDuplicateWarning(dupRes);
              setLoading(false);
              return;
           }
         } catch (dupErr) {
           console.warn("Duplicate check failed, continuing smoothly...", dupErr);
         }
      }

      let finalAttachmentUrl = formData.attachmentUrl;
      if (uploadFile) {
         setIsUploading(true);
         try {
           const upRes = await uploadComplaintImage(uploadFile);
           if (upRes.success) {
              finalAttachmentUrl = upRes.imageUrl.startsWith("http") ? upRes.imageUrl : `http://localhost:5000${upRes.imageUrl}`;
           }
         } catch (upErr) {
           console.warn("Image upload failed, saving without attachment", upErr);
         }
         setIsUploading(false);
      }

      await submitComplaint({ ...formData, attachmentUrl: finalAttachmentUrl });
      setSuccessMessage("Complaint submitted successfully.");
      setFormData({
        ...initialForm,
        name: user?.name || "",
        email: user?.email || ""
      });
      setUploadFile(null);
      setImagePreview(null);

      setTimeout(() => {
        navigate(user ? "/my-complaints" : "/dashboard");
      }, 800);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    executeSubmit(false);
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
          Issue Type (Auto-Detected)
          <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            {isAnalyzing ? (
              <span style={{ background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Analyzing...</span>
            ) : detectedCategory ? (
              <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>✨ Detected Category: {detectedCategory}</span>
            ) : (
              <span style={{ background: '#6b7280', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Awaiting description...</span>
            )}
          </div>
          <input type="hidden" name="category" value={formData.category} />
        </label>

        <label>
          Location
          {!formData.location || locationError === "manual" ? (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button 
                type="button" 
                onClick={handleLocationFetch} 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '4px', fontSize: '0.9rem' }}
                disabled={fetchingLocation}
              >
                📍 {fetchingLocation ? "Fetching location..." : "Use My Location"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setLocationError("manual")} 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '4px', fontSize: '0.9rem' }}
              >
                ✍️ Enter Manually
              </button>
            </div>
          ) : null}
          
          {locationError && locationError !== "manual" && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '10px' }}>
              {locationError}
            </p>
          )}

          {formData.location && locationError !== "manual" ? (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: '500' }}>📍 {formData.location}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={() => setLocationError("manual")} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>Edit</button>
                 <button type="button" onClick={() => { setFormData(prev => ({...prev, location: ''})); setLocationError(""); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
              </div>
            </div>
          ) : (
            (locationError === "manual" || locationError) && (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter Location Manually"
                required
              />
            )
          )}
        </label>

        <label>
          Nearest City (Optional)
          <input
            type="text"
            name="nearestCity"
            value={formData.nearestCity}
            onChange={handleChange}
            placeholder="Example: Hyderabad"
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
          Attach Image
          <div style={{ border: '2px dashed #4b5563', padding: '1rem', borderRadius: '6px', textAlign: 'center', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            {imagePreview ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <img src={imagePreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '4px', marginBottom: '10px' }} />
                 <label htmlFor="image-upload" style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', fontSize: '0.9rem' }}>Change Image</label>
               </div>
            ) : (
               <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
                 <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                 <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Click or drag a JPG/PNG to upload</span>
               </label>
            )}
          </div>
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

        {duplicateWarning && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
             <h4 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Similar Issue Detected Nearby</h4>
             <p style={{ fontSize: '0.9rem', color: '#d1d5db', marginBottom: '10px' }}>
                We found a {Math.round(duplicateWarning.confidence * 100)}% match with an existing complaint: <br/>
                <strong style={{ color: 'white' }}>"{duplicateWarning.existingComplaint.message}"</strong>
             </p>
             <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handleSupportExisting} disabled={duplicateActionLoading} style={{ flex: 1, background: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                   👍 Support Existing
                </button>
                <button type="button" onClick={() => executeSubmit(true)} disabled={duplicateActionLoading} style={{ flex: 1, background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
                   ➕ Submit Anyway
                </button>
             </div>
          </div>
        )}

        <div className="form-highlight">
          <strong>Advanced intake enabled</strong>
          <p>
            New complaints now capture optional contact details, location hints,
            attachment links, and live map context for faster processing.
          </p>
        </div>

        {!duplicateWarning && (
           <button type="submit" className="button" disabled={loading || isUploading}>
             {loading || isUploading ? "Processing..." : "Submit Complaint"}
           </button>
        )}
      </form>
    </section>
  );
}

export default ComplaintForm;
