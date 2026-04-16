import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Heatmap Wrapper Component
function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);
  return null;
}

export default function LiveMapDashboard({ complaints }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Filter complaints that actually have lat/lng
  const geoComplaints = useMemo(() => complaints.filter(c => c.lat && c.lng), [complaints]);
  const heatPoints = useMemo(() => geoComplaints.map(c => [c.lat, c.lng, 1]), [geoComplaints]);
  const center = geoComplaints.length > 0 ? [geoComplaints[0].lat, geoComplaints[0].lng] : [20.5937, 78.9629]; 

  return (
    <div style={{ height: '700px', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 1000, background: 'rgba(15, 23, 42, 0.9)', padding: '12px', borderRadius: '8px', color: 'white', border: '1px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          🔥 Heatmap Intensity View
        </label>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
          {geoComplaints.length} precise geo-markers active
        </p>
      </div>

      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {showHeatmap && <HeatmapLayer points={heatPoints} />}

        {!showHeatmap && (
          <MarkerClusterGroup>
            {geoComplaints.map(c => (
              <Marker key={c._id} position={[c.lat, c.lng]}>
                <Popup className="custom-popup">
                  <div style={{ minWidth: '220px' }}>
                     <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#1e293b' }}>{c.category || 'General'}</h3>
                     <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', maxHeight: '100px', overflowY: 'auto' }}>{c.message}</p>
                     
                     {c.attachmentUrl && (
                        <div style={{ marginBottom: '10px' }}>
                           <img src={c.attachmentUrl} alt="Complaint Attachment" style={{ width: '100%', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                     )}
                     
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                        <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#0f172a' }}>{c.status}</span>
                        <span style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#991b1b', fontWeight: 'bold' }}>Priority: {c.priority}</span>
                        {c.supportCount > 0 && <span style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#1e40af' }}>Supports: {c.supportCount}</span>}
                     </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
}
