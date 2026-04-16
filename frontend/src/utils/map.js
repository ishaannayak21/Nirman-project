export const buildMapQuery = (complaint) => {
  return [complaint.location, complaint.nearestCity, complaint.ward, complaint.landmark]
    .filter(Boolean)
    .join(", ");
};

export const buildMapEmbedUrl = (complaint) => {
  const query = encodeURIComponent(buildMapQuery(complaint) || "India");
  return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
};
