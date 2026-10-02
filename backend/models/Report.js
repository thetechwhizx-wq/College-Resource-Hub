// models/Report.js
// A student's report that a resource is outdated, incorrect, or unavailable.
const mongoose = require("mongoose");

const REPORT_REASONS = ["Outdated", "Incorrect / wrong file", "Link not working", "Other"];

const reportSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  resourceTitle: { type: String, required: true }, // copied at report time so it still shows even if the resource is later deleted
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reporterName: { type: String, required: true },  // copied for the same reason
  reason: { type: String, enum: REPORT_REASONS, required: true },
  comment: { type: String, default: "", trim: true },
  status: { type: String, enum: ["open", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", reportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
