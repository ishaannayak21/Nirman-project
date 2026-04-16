import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    ticketId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    nearestCity: {
      type: String,
      default: "",
      trim: true
    },
    ward: {
      type: String,
      default: "",
      trim: true
    },
    landmark: {
      type: String,
      default: "",
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    },
    aiSummary: {
      type: String,
      default: ""
    },
    aiCategoryConfidence: {
      type: Number,
      default: 0
    },
    aiTags: {
      type: [String],
      default: []
    },
    aiSentiment: {
      type: String,
      default: ""
    },
    aiUrgencyDrivers: {
      type: [String],
      default: []
    },
    aiRecommendedAction: {
      type: String,
      default: ""
    },
    attachmentUrl: {
      type: String,
      default: "",
      trim: true
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
