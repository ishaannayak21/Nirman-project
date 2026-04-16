/**
 * Unified Hybrid AI Engine Module for Nirman - Smart Grievance Portal
 * 
 * ARCHITECTURE:
 * 1. PRIMARY (Optional API): Connects to Gemini/OpenAI if an API key is provided.
 * 2. DEFAULT/FALLBACK (Local): Highly optimized offline algorithm. 
 *    - No heavy ML dependencies.
 *    - Instant execution.
 *    - Fully functional on completely offline laptops.
 */

// --- 🧠 STEP 1: TEXT PREPROCESSING & LANGUAGE HANDLING ---
const HINGLISH_DICT = {
  "paani": "water",
  "kooda": "garbage",
  "bijli": "electricity",
  "kachra": "garbage",
  "sadak": "road",
  "gaddha": "pothole"
};

export const preprocessText = (text) => {
  if (!text) return "";
  
  let cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let words = cleanText.split(" ");
  words = words.map(w => HINGLISH_DICT[w] || w);
  
  return words.join(" ");
};

// --- 🚨 STEP 2: SAFETY & EMERGENCY CHECK ---
const EMERGENCY_WORDS = ["theft", "robbery", "attack", "harassment", "crime", "murder", "fight", "kidnap", "rape", "gun", "guns", "shooting", "shot", "shots", "weapon", "kill", "killing", "dead", "stole", "steal", "thief", "blood", "fire", "stolen"];

const detectEmergencyLocal = (words) => {
  if (words.some(w => EMERGENCY_WORDS.includes(w))) {
    return {
      category: "Emergency",
      priority: "High",
      action: "redirect",
      message: "This platform handles civic issues. Please contact emergency services (Police)."
    };
  }
  return null;
};

// --- 🧪 STEP 3: SPAM / SHORT INPUT CHECK ---
const detectSpamOrShortLocal = (words, cleanText) => {
  const isNumberOnly = /^[0-9\s]+$/.test(cleanText);
  const hasSpamPattern = /asdf|qwer|zxcv/i.test(cleanText);
  // Also catch lines with almost zero vowels if it's long enough
  const vowelToConsonantRatio = cleanText.length > 5 ? (cleanText.match(/[aeiou]/gi) || []).length / cleanText.length : 1;
  
  if (cleanText.length === 0 || isNumberOnly || hasSpamPattern || (cleanText.length > 8 && vowelToConsonantRatio < 0.1)) {
    return { category: "Invalid", message: "Invalid complaint description" };
  }

  const STRONG_KEYWORDS = ["water", "garbage", "electricity", "road", "pothole", "leak", "wire", "drain", "sewer"];
  const hasStrongKeyword = words.some(w => STRONG_KEYWORDS.includes(w));
  
  if (words.length <= 2 && !hasStrongKeyword) {
    return { category: "Unclear", message: "Please describe the issue in more detail" };
  }

  return null;
};

// --- 📂 STEP 4: CATEGORY DETECTION ---
const CATEGORY_KEYWORDS = {
  "Electricity": ["light", "wire", "electricity", "power", "pole", "transformer", "shortcut", "shock", "spark"],
  "Public Safety": ["manhole", "unsafe", "danger", "accident", "emergency", "broken", "branch", "tree", "hanging"],
  "Road Damage": ["pothole", "road", "crack", "pavement"],
  "Water Issue": ["water", "leak", "leaking", "leakage", "pipeline", "supply", "pipe", "drinking", "sewage", "drain"],
  "Sanitation": ["garbage", "waste", "smell", "drainage", "sewer", "trash", "overflow", "dirt", "dust", "sweep"]
};

const detectCategoryLocal = (words) => {
  let matches = [];
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    words.forEach(word => {
      if (keywords.includes(word)) matchCount++;
    });
    if (matchCount > 0) matches.push({ category, count: matchCount });
  }

  if (matches.length === 0) {
    return { category: "Unclear", priority: "Low", message: "Please provide more details about the issue", confidenceNumeric: 0 };
  }

  matches.sort((a,b) => b.count - a.count);
  let confidenceNumeric = Math.min(0.6 + (matches[0].count * 0.15), 0.95);

  if (matches.length > 1) {
    const cats = matches.map(m => m.category);
    return { category: cats, primaryCategory: cats[0], multiIssue: true, confidenceNumeric };
  }

  return { category: matches[0].category, confidenceNumeric };
};

// --- ⚡ STEP 5: PRIORITY DETECTION ---
const PRIORITY_WORDS = {
  high: ["danger", "accident", "huge", "live", "wire", "overflow", "emergency", "severe", "critical", "dangerous", "fatal", "blood", "fire"],
  medium: ["main", "traffic", "school", "college", "daily", "regular", "broken", "leak"]
};

const detectPriorityLocal = (words, text, categoryObj) => {
  if (categoryObj.priority) return categoryObj.priority;

  let score = 0;
  PRIORITY_WORDS.high.forEach(kw => { if (text.toLowerCase().includes(kw)) score += 3; });
  PRIORITY_WORDS.medium.forEach(kw => { if (text.toLowerCase().includes(kw)) score += 1; });

  let priority = "Low";
  if (score >= 3) priority = "High";
  else if (score >= 1) priority = "Medium";

  // Check if ANY of the matched categories trigger a priority upgrade, not just the primary
  const cats = Array.isArray(categoryObj.category) ? categoryObj.category : [categoryObj.category];
  
  if (cats.includes("Electricity") && text.includes("wire")) priority = "High";
  if (cats.includes("Public Safety") && text.includes("manhole")) {
    if (priority === "Low") priority = "Medium";
  }

  return priority;
};

// --- 🔁 STEP 6: DUPLICATE DETECTION AND LOCATION HANDLING ---
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
};

const calculateSimilarity = (words1, words2) => {
  if (words1.length === 0 || words2.length === 0) return 0;
  const set1 = new Set(words1), set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size / new Set([...set1, ...set2]).size;
};

const detectDuplicateLogic = (textWords, lat, lon, existingComplaints) => {
  if (!existingComplaints || existingComplaints.length === 0 || lat == null || lon == null) {
    return { isDuplicate: false, similarityScore: 0 };
  }

  let highestSimilarity = 0;
  let duplicateCandidate = null;

  for (const complaint of existingComplaints) {
    const existingLat = complaint.latitude || complaint.location?.lat;
    const existingLon = complaint.longitude || complaint.location?.lng;

    if (haversineDistance(lat, lon, existingLat, existingLon) <= 100) {
      const existingText = (complaint.description || complaint.text || "").toLowerCase().replace(/[^\w\s]|_/g, " ").replace(/\s+/g, " ").trim();
      const sim = calculateSimilarity(textWords, existingText.split(" "));

      if (sim > highestSimilarity) {
        highestSimilarity = sim;
        duplicateCandidate = complaint;
      }
    }
  }

  if (highestSimilarity > 0.75) {
    return { isDuplicate: true, duplicateId: duplicateCandidate._id || duplicateCandidate.id, similarityScore: highestSimilarity };
  } else if (highestSimilarity >= 0.5) {
    return { duplicate: "possible", isDuplicate: false, message: "Similar issue found. Please verify.", duplicateId: duplicateCandidate._id || duplicateCandidate.id, similarityScore: highestSimilarity };
  }

  return { isDuplicate: false, similarityScore: 0 };
};

const getConfidenceLevel = (score) => {
  if (score > 0.8) return "High";
  if (score >= 0.5) return "Medium";
  return "Low";
};

// --- CORE LOCAL ALGORITHM ---
const analyzeLocal = (text, latitude, longitude, existingComplaints) => {
  const cleanText = preprocessText(text);
  const words = cleanText.split(" ").filter(w => w.length > 0);

  const emergencyOutput = detectEmergencyLocal(words);
  if (emergencyOutput) return emergencyOutput;

  const spamOutput = detectSpamOrShortLocal(words, cleanText);
  if (spamOutput) return spamOutput;

  let catOutput = detectCategoryLocal(words);
  if (catOutput.category === "Unclear") return catOutput;

  const priority = detectPriorityLocal(words, cleanText, catOutput);
  let locationStatus = (latitude == null || longitude == null) ? "Not Provided" : "Provided";
  let dupOutput = detectDuplicateLogic(words, latitude, longitude, existingComplaints);

  let confNum = catOutput.confidenceNumeric || 0;
  if (dupOutput.isDuplicate) confNum = Math.min(1.0, confNum + 0.1);

  return {
    ...catOutput,
    priority,
    locationStatus,
    ...dupOutput,
    confidence: getConfidenceLevel(confNum),
    source: "local-algorithm" // For debugging
  };
};

// --- OPTIONAL CLOUD AI (ZERO DEPENDENCIES) ---
const analyzeWithCloudAI = async (text) => {
  if (process.env.GEMINI_API_KEY) {
    const prompt = `Analyze this civic complaint: "${text}". Categorize it strictly into one of: ["Road Damage", "Water Issue", "Sanitation", "Electricity", "Public Safety", "Other"]. Predict priority as: ["High", "Medium", "Low"]. Respond purely in valid JSON format: { "category": "xxx", "priority": "xxx" } without markdown.`;
    
    // We use the native fetch API (Zero external npm libraries needed, runs instantly anywhere Node 18+ is installed)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error("Cloud AI Network Error");

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonString = rawText.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonString);
    }
    
    throw new Error("Failed to parse AI response as JSON");
  }
  
  return null;
};

// --- MAIN EXPORT: HYBRID analyzeComplaint ---
/**
 * Analyzes a complaint utilizing a robust Hybrid AI approach.
 * Reverts to offline heuristics fallback instantly if disconnected or API key missing.
 */
export const analyzeComplaint = async (text, latitude, longitude, existingComplaints = []) => {
  try {
    // 1. Safety edge cases and Duplicates are ALWAYS evaluated locally for speed & privacy
    const cleanText = preprocessText(text);
    const words = cleanText.split(" ").filter(w => w.length > 0);
    
    // Quick Spam & Emergency abort
    const emergencyOutput = detectEmergencyLocal(words);
    if (emergencyOutput) return emergencyOutput;
    
    const spamOutput = detectSpamOrShortLocal(words, cleanText);
    if (spamOutput) return spamOutput;

    let locationStatus = (latitude == null || longitude == null) ? "Not Provided" : "Provided";
    let dupOutput = detectDuplicateLogic(words, latitude, longitude, existingComplaints);

    // 2. Try Optional Cloud AI for Categorization and Priority
    if (process.env.GEMINI_API_KEY) {
      try {
        const cloudResult = await analyzeWithCloudAI(text);
        if (cloudResult && cloudResult.category && cloudResult.priority) {
          return {
            category: cloudResult.category,
            priority: cloudResult.priority,
            locationStatus,
            ...dupOutput,
            confidence: "High", // High confidence if AI parsed it correctly
            source: "cloud-api"
          };
        }
      } catch (cloudErr) {
        console.warn("Nirman OS: Cloud AI unavailable or failed. Switching to Local Fullback logic...", cloudErr.message);
        // Silently catch and flow downward to local fallback
      }
    }

    // 3. Complete Local Offline Fallback Function
    return analyzeLocal(text, latitude, longitude, existingComplaints);

  } catch (error) {
    console.error("AI Engine Severe Error:", error);
    // 🛡 Fail-Safe Default System
    return {
      category: "Other",
      priority: "Low",
      isDuplicate: false,
      confidence: "Low",
      source: "failsafe-default"
    };
  }
};
