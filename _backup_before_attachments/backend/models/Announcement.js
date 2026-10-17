// models/Announcement.js
const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true } // "YYYY-MM-DD"
});

module.exports = mongoose.model("Announcement", announcementSchema);
