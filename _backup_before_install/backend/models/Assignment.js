const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  deadline: { type: String, required: true }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;