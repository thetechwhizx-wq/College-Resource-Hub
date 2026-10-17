// models/UploadedFile.js
// Stores an uploaded PDF (notes, results...) inside MongoDB itself.
// Why not on disk? Free hosting (Render) wipes the disk on every restart, so files would vanish.
// The database survives restarts, so the PDF is kept there as binary data.
const mongoose = require("mongoose");

const uploadedFileSchema = new mongoose.Schema({
  name: { type: String, required: true },          // original file name, e.g. "DBMS-Unit1.pdf"
  contentType: { type: String, default: "application/pdf" },
  size: { type: Number, required: true },          // size in bytes
  data: { type: Buffer, required: true },          // the PDF itself
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UploadedFile", uploadedFileSchema);
