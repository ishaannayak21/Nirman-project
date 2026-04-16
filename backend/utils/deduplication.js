// NLP Normalization & Similarity Logic
const stopWords = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "am", "in", "on", "at", "to", "for", "with", "there", "some", "this", "that", "my", "our", "of", "from", "it", "we", "they", "has", "have"]);

const synonymMap = {
  "trash": "garbage",
  "waste": "garbage",
  "pothole": "road",
  "street": "road",
  "leak": "water",
  "leaking": "water",
  "repair": "fix",
  "broken": "damage",
  "issue": "problem"
};

const normalizeText = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/)
    .map(word => synonymMap[word] || word) // map synonyms for better scoring
    .filter((word) => word.length > 2 && !stopWords.has(word));
};

export const getTextSimilarity = (text1, text2) => {
  const set1 = new Set(normalizeText(text1));
  const set2 = new Set(normalizeText(text2));

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of set1) {
    if (set2.has(word)) intersectionSize++;
  }

  const unionSize = set1.size + set2.size - intersectionSize;
  return intersectionSize / unionSize; // Jaccard Similarity
};

// Geo Proximity Logic: Haversine formula
export const getGeoDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};
