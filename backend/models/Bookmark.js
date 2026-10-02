// models/Bookmark.js
// Links a User to a Resource they want to save for quick access later.
const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  createdAt: { type: Date, default: Date.now }
});

// A compound unique index: the SAME user cannot bookmark the SAME resource twice.
bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
