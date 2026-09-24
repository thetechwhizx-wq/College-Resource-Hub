require("dotenv").config();
const Subject = require("./models/Subject");
const Resource = require("./models/Resource");
const Assignment = require("./models/Assignment");
const Announcement = require("./models/Announcement");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("College Resource Hub backend is running!");
});

app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

// Get all resources
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
      console.error("Error fetching resources:", error);
    res.status(500).json({ message: err.message });
  }
});

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.json(assignments);
  } catch (err) {
      console.error("Error fetching assignments:", error);
    res.status(500).json({ message: err.message });
  }
});

// Get all announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (err) {
      console.error("Error fetching announcements:", error);
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});