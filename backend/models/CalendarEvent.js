// models/CalendarEvent.js
// One entry on the academic calendar: an internal exam, an assignment/project deadline,
// or any other important date. (Separate from Assignment/Announcement so the calendar
// can show a unified timeline of everything at once.)
const mongoose = require("mongoose");

const CALENDAR_CATEGORIES = ["Exam", "Assignment", "Project", "Other"];

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true },  // "YYYY-MM-DD"
  category: { type: String, enum: CALENDAR_CATEGORIES, default: "Other" },
  description: { type: String, default: "", trim: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" }, // optional time table (PDF or photo)
  fileName: { type: String, default: "" }                               // its original name
});

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
module.exports.CALENDAR_CATEGORIES = CALENDAR_CATEGORIES;
