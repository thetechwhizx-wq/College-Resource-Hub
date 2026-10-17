// models/Announcement.js
const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  description: { type: String, default: "", trim: true, maxlength: 2000 }, // optional longer message
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" },   // optional attachment (PDF or photo)
  fileName: { type: String, default: "" }                                 // its original name
});

module.exports = mongoose.model("Announcement", announcementSchema);
