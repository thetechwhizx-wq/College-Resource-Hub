// models/Assignment.js
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  deadline: { type: String, required: true } // stored as "YYYY-MM-DD" text so it sorts correctly
});

module.exports = mongoose.model("Assignment", assignmentSchema);
