const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  }
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;