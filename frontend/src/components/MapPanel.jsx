import { buildMapEmbedUrl, buildMapQuery } from "../utils/map.js";

function MapPanel({ complaint, title = "Location Map" }) {
  const query = buildMapQuery(complaint);

  return (
    <div className="map-panel">
      <div className="map-panel__header">
        <strong>{title}</strong>
        <span>{query || "Location not available"}</span>
      </div>
      {query ? (
        <iframe
          title={`${title}-${complaint.ticketId || complaint.location || "map"}`}
          src={buildMapEmbedUrl(complaint)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <p className="map-panel__empty">Add location details to view map preview.</p>
      )}
    </div>
  );
}

export default MapPanel;
