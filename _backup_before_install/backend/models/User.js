// models/User.js
// Stores login accounts. Passwords are NEVER stored as plain text - only as a bcrypt hash.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // will hold the HASH, not the real password
  role: { type: String, enum: ["student", "admin"], default: "student" }
});

// This runs automatically BEFORE every save().
// If the password was set or changed, replace it with its hash.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // password unchanged -> nothing to do
  this.password = await bcrypt.hash(this.password, 10); // 10 = how many times the hashing is "salted"/repeated
});

// Helper used at login: compares the typed password with the stored hash.
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
