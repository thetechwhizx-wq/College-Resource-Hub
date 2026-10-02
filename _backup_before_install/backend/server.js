require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import Models
const Subject = require("./models/Subject");
const Resource = require("./models/Resource");
const Assignment = require("./models/Assignment");
const Announcement = require("./models/Announcement");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Root Test Route
app.get("/", (req, res) => {
  res.send("College Resource Hub backend is running!");
});

// ==========================================
// 1. SUBJECT ROUTES
// ==========================================
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const newSubject = new Subject({
      name: req.body.name,
      semester: req.body.semester
    });
    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (err) {
    console.error("Error creating subject:", err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Subject not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    console.error("Error deleting subject:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. RESOURCE ROUTES
// ==========================================
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/resources", async (req, res) => {
  try {
    const newResource = new Resource({
      title: req.body.title,
      subject: req.body.subject,
      unit: req.body.unit
    });
    const savedResource = await newResource.save();
    res.status(201).json(savedResource);
  } catch (err) {
    console.error("Error creating resource:", err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/resources/:id", async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Resource not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating resource:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/resources/:id", async (req, res) => {
  try {
    const deleted = await Resource.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Resource not found" });
    res.json({ message: "Resource deleted" });
  } catch (err) {
    console.error("Error deleting resource:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. ASSIGNMENT ROUTES
// ==========================================
app.get("/api/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/assignments", async (req, res) => {
  try {
    const newAssignment = new Assignment({
      title: req.body.title,
      subject: req.body.subject,
      deadline: req.body.deadline
    });
    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/assignments/:id", async (req, res) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Assignment not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating assignment:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/assignments/:id", async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. ANNOUNCEMENT ROUTES
// ==========================================
app.get("/api/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/announcements", async (req, res) => {
  try {
    const newAnnouncement = new Announcement({
      title: req.body.title,
      date: req.body.date
    });
    const savedAnnouncement = await newAnnouncement.save();
    res.status(201).json(savedAnnouncement);
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/announcements/:id", async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Announcement not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating announcement:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/announcements/:id", async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});