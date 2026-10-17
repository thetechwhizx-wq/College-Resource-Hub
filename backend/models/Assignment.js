// models/Assignment.js
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  deadline: { type: String, required: true }, // stored as "YYYY-MM-DD" text so it sorts correctly
  description: { type: String, default: "", trim: true, maxlength: 2000 }, // optional extra instructions
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" },   // optional question paper / info (PDF or photo)
  fileName: { type: String, default: "" }                                 // its original name
});

module.exports = mongoose.model("Assignment", assignmentSchema);
