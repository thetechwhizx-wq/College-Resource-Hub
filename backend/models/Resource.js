// models/Resource.js
// Study material (notes, PDFs, videos) that belongs to a subject.
const mongoose = require("mongoose");

const RESOURCE_TYPES = ["Notes", "PDF", "PPT", "Video", "Question Paper", "Result", "Other"];

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },   // e.g. "Unit 1 Notes"
  subject: { type: String, required: true, trim: true }, // subject NAME, e.g. "Data Structures"
  // "semester" is a COPY of the subject's semester, filled in automatically by the frontend
  // when the admin picks a subject. Storing it here (instead of looking it up every time)
  // makes filtering resources by semester a single fast query instead of a join.
  semester: { type: Number, min: 1, max: 8, default: null },
  unit: { type: String, default: "", trim: true },       // e.g. "Unit 1"
  type: { type: String, enum: RESOURCE_TYPES, default: "Notes" },
  link: { type: String, default: "", trim: true },       // optional Google Drive / website URL
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedFile" }, // optional uploaded PDF
  fileName: { type: String, default: "" },               // its original name
  views: { type: Number, default: 0 }                    // how many times a student opened this resource
});

module.exports = mongoose.model("Resource", resourceSchema);
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
