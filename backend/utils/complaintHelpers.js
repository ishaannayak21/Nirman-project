const CATEGORY_RULES = [
  {
    category: "Water Supply",
    department: "Water Department",
    keywords: ["water", "pipe", "drain", "sewage", "tap"]
  },
  {
    category: "Electricity",
    department: "Electricity Board",
    keywords: ["electric", "power", "current", "transformer", "street light"]
  },
  {
    category: "Roads",
    department: "Roads Department",
    keywords: ["road", "pothole", "traffic", "street", "bridge"]
  },
  {
    category: "Sanitation",
    department: "Sanitation Department",
    keywords: ["garbage", "waste", "trash", "clean", "sanitation"]
  }
];

const PRIORITY_RULES = [
  { priority: "Critical", keywords: ["hospital", "fire", "danger", "accident"] },
  { priority: "High", keywords: ["urgent", "flood", "no water", "power cut", "unsafe"] },
  { priority: "Medium", keywords: ["delay", "issue", "problem", "broken"] }
];

export const createTicketId = () => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${Date.now()}-${randomPart}`;
};

export const detectCategoryDetails = (category, message) => {
  const sourceText = `${category} ${message}`.toLowerCase();

  const matchedRule = CATEGORY_RULES.find((rule) =>
    rule.keywords.some((keyword) => sourceText.includes(keyword))
  );

  if (!matchedRule) {
    return {
      category: category || "General",
      department: "Public Grievance Cell"
    };
  }

  return {
    category: matchedRule.category,
    department: matchedRule.department,
    confidence: 0.86,
    tags: matchedRule.keywords.filter((keyword) => sourceText.includes(keyword))
  };
};

export const detectPriority = (message) => {
  const sourceText = message.toLowerCase();

  const matchedRule = PRIORITY_RULES.find((rule) =>
    rule.keywords.some((keyword) => sourceText.includes(keyword))
  );

  return matchedRule ? matchedRule.priority : "Low";
};

export const buildAiSummary = ({ category, location, priority, message }) => {
  return `${priority} priority ${category.toLowerCase()} complaint reported from ${location}. ${message}`;
};

export const buildAiInsights = ({ category, message, location }) => {
  const sourceText = `${category} ${message} ${location}`.toLowerCase();
  const sentiment = sourceText.includes("urgent") || sourceText.includes("unsafe")
    ? "High concern"
    : "Normal concern";

  const urgencyDrivers = [
    "urgent",
    "danger",
    "no water",
    "power cut",
    "unsafe",
    "flood"
  ].filter((term) => sourceText.includes(term));

  return {
    sentiment,
    urgencyDrivers,
    recommendedAction:
      urgencyDrivers.length > 0
        ? "Escalate to field team and notify admin."
        : "Track normally through workflow."
  };
};
