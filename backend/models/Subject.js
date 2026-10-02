// models/Subject.js
// A "model" describes the shape of the documents stored in one MongoDB collection.
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. "Data Structures"
  semester: { type: Number, required: true, min: 1, max: 8 } // e.g. 3
});

module.exports = mongoose.model("Subject", subjectSchema);
