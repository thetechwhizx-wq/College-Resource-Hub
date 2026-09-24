const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  unit: { type: String, required: true }
});

const Resource = mongoose.model("Resource", resourceSchema);

module.exports = Resource;