// server.js - the entry point of the backend.
// Run it with:  npm start   (or)   node server.js

require("dotenv").config(); // load MONGO_URI etc. from the .env file FIRST

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");

// Models (one per MongoDB collection)
const Subject = require("./models/Subject");
const Resource = require("./models/Resource");
const Assignment = require("./models/Assignment");
const Announcement = require("./models/Announcement");
const User = require("./models/User");
const Bookmark = require("./models/Bookmark");
const CalendarEvent = require("./models/CalendarEvent");
const Report = require("./models/Report");

// Security guards (middleware)
const { verifyToken, adminOnly, getSecret } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// A code that must be typed to register as an admin, so registration can't be used
// by anyone to silently grant themselves admin access. Change it in .env for real use.
function getAdminSignupCode() {
  return process.env.ADMIN_SIGNUP_CODE || "admin-signup-2026";
}

// ---------- GLOBAL MIDDLEWARE ----------
app.use(cors());          // lets a page served from another port (e.g. Live Server :5500) call this API
app.use(express.json());  // lets us read JSON sent in request bodies (req.body)

// Serve the frontend folder too. That means the whole app can be opened at
// http://localhost:3000  - no Live Server needed (handy for the viva demo).
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---------- AUTH: LOGIN ----------
// POST /api/auth/login   body: { email, password }
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const passwordMatches = user ? await user.comparePassword(password) : false;

    // Same message for "no such email" and "wrong password" so attackers can't find out which emails exist
    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token: token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ---------- AUTH: REGISTER (Create Account) ----------
// POST /api/auth/register   body: { name, email, password, role, adminCode }
// role is "student" or "admin". Registering as "admin" additionally requires the correct adminCode,
// so that a public signup form cannot be used to grant admin access to just anyone.
app.post("/api/auth/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const role = req.body.role === "admin" ? "admin" : "student";
    const adminCode = req.body.adminCode || "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (role === "admin" && adminCode !== getAdminSignupCode()) {
      return res.status(403).json({ message: "Incorrect admin signup code." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Password gets hashed automatically by the pre-save hook in models/User.js
    const user = await User.create({ name, email, password, role });

    // Log the new user in immediately, same as the login route does
    const token = signToken(user);
    res.status(201).json({ token: token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

function signToken(user) {
  return jwt.sign({ id: user._id, name: user.name, role: user.role }, getSecret(), { expiresIn: "1d" });
}

// ---------- CRUD ROUTES (one helper used for several models) ----------
// Instead of copy-pasting the same 4 routes for every model, this function builds them.
//   GET    /api/xyz        -> any logged-in user can read
//   POST   /api/xyz        -> admin only (Create)
//   PUT    /api/xyz/:id    -> admin only (Update)
//   DELETE /api/xyz/:id    -> admin only (Delete)
function createCrudRoutes(basePath, Model) {
  app.get(basePath, verifyToken, async (req, res) => {
    try {
      res.json(await Model.find());
    } catch (err) {
      res.status(500).json({ message: "Could not fetch data." });
    }
  });

  app.post(basePath, verifyToken, adminOnly, async (req, res) => {
    try {
      const created = await Model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: err.message }); // usually a validation error
    }
  });

  app.put(basePath + "/:id", verifyToken, adminOnly, async (req, res) => {
    try {
      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: "Item not found." });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete(basePath + "/:id", verifyToken, adminOnly, async (req, res) => {
    try {
      const deleted = await Model.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Item not found." });
      res.json({ message: "Deleted successfully." });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
}

createCrudRoutes("/api/subjects", Subject);
createCrudRoutes("/api/resources", Resource);
createCrudRoutes("/api/assignments", Assignment);
createCrudRoutes("/api/announcements", Announcement);
createCrudRoutes("/api/calendar-events", CalendarEvent); // academic calendar, admin manages it the same way

// ---------- RESOURCE VIEW TRACKING (for admin analytics) ----------
// Called from the frontend every time a student clicks "Open / Download" on a resource.
app.post("/api/resources/:id/view", verifyToken, async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: "Resource not found." });
    res.json({ views: updated.views });
  } catch (err) {
    res.status(400).json({ message: "Could not record view." });
  }
});

// ---------- BOOKMARKS (per-user, not admin-only - every user manages their own) ----------
// GET /api/bookmarks -> only THIS user's bookmarked resources (already populated with resource details)
app.get("/api/bookmarks", verifyToken, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id }).populate("resource");
    // Some bookmarks might point at a resource that was since deleted by an admin - skip those safely.
    const valid = bookmarks.filter(function (b) { return b.resource; });
    res.json(valid.map(function (b) { return { bookmarkId: b._id, resource: b.resource }; }));
  } catch (err) {
    res.status(500).json({ message: "Could not fetch bookmarks." });
  }
});

// POST /api/bookmarks   body: { resourceId }
app.post("/api/bookmarks", verifyToken, async (req, res) => {
  try {
    const resource = await Resource.findById(req.body.resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found." });

    const bookmark = await Bookmark.create({ user: req.user.id, resource: resource._id });
    res.status(201).json({ bookmarkId: bookmark._id });
  } catch (err) {
    if (err.code === 11000) { // MongoDB's "duplicate key" error code -> the unique index caught a repeat
      return res.status(409).json({ message: "Already bookmarked." });
    }
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/bookmarks/:resourceId  - un-bookmark by resource id (simpler for the frontend than needing the bookmark's own id)
app.delete("/api/bookmarks/:resourceId", verifyToken, async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ user: req.user.id, resource: req.params.resourceId });
    res.json({ message: "Bookmark removed." });
  } catch (err) {
    res.status(400).json({ message: "Could not remove bookmark." });
  }
});

// ---------- RESOURCE FEEDBACK / REPORTING ----------
// Any logged-in user can file a report. Only admins can view/resolve them.
// POST /api/reports   body: { resourceId, reason, comment }
app.post("/api/reports", verifyToken, async (req, res) => {
  try {
    const resource = await Resource.findById(req.body.resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found." });

    const report = await Report.create({
      resource: resource._id,
      resourceTitle: resource.title,
      reportedBy: req.user.id,
      reporterName: req.user.name,
      reason: req.body.reason,
      comment: req.body.comment || ""
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reports (admin only) - newest first
app.get("/api/reports", verifyToken, adminOnly, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch reports." });
  }
});

// PUT /api/reports/:id (admin only) - mark resolved/open again
app.put("/api/reports/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Report not found." });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/reports/:id (admin only)
app.delete("/api/reports/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(400).json({ message: "Could not delete report." });
  }
});

// ---------- ADMIN ANALYTICS ----------
// One endpoint that gathers everything the admin analytics page needs.
// Kept as plain JS array operations (instead of MongoDB aggregation pipelines) because a
// college project's dataset is small and this is far easier to read and explain in a viva.
app.get("/api/analytics", verifyToken, adminOnly, async (req, res) => {
  try {
    const [subjects, resources, assignments, announcements, students, admins, openReports, totalBookmarks] =
      await Promise.all([
        Subject.countDocuments(),
        Resource.find(), // need the full documents (for views/subject grouping), not just a count
        Assignment.countDocuments(),
        Announcement.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "admin" }),
        Report.countDocuments({ status: "open" }),
        Bookmark.countDocuments()
      ]);

    // Top 5 most-viewed resources
    const topResources = resources
      .slice()
      .sort(function (a, b) { return b.views - a.views; })
      .slice(0, 5)
      .map(function (r) { return { title: r.title, subject: r.subject, views: r.views }; });

    // Resource count grouped by subject (plain JS grouping - easy to explain: "a running count in an object")
    const countsBySubject = {};
    resources.forEach(function (r) {
      countsBySubject[r.subject] = (countsBySubject[r.subject] || 0) + 1;
    });
    const resourcesBySubject = Object.keys(countsBySubject)
      .map(function (subject) { return { subject: subject, count: countsBySubject[subject] }; })
      .sort(function (a, b) { return b.count - a.count; });

    const totalViews = resources.reduce(function (sum, r) { return sum + r.views; }, 0);

    res.json({
      totals: { subjects, resources: resources.length, assignments, announcements, students, admins, totalBookmarks, totalViews },
      topResources,
      resourcesBySubject,
      openReports
    });
  } catch (err) {
    console.error("Analytics error:", err.message);
    res.status(500).json({ message: "Could not build analytics." });
  }
});

// ---------- AUTO-SEED DEFAULT USERS ----------
// Runs once each time the server connects to MongoDB.
// It only creates an account if that email does not exist yet, so it is safe to run repeatedly.
async function seedDefaultUsers() {
  const defaultUsers = [
    { name: "Admin", email: "admin@college.edu", password: "admin123", role: "admin" },
    { name: "Student", email: "student@college.edu", password: "student123", role: "student" }
  ];

  for (const u of defaultUsers) {
    const alreadyExists = await User.findOne({ email: u.email });
    if (!alreadyExists) {
      await User.create(u); // the password gets hashed by the pre-save hook in User.js
      console.log("Seeded default " + u.role + ": " + u.email);
    }
  }
}

// ---------- CONNECT TO MONGODB, THEN START THE SERVER ----------
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Create a backend/.env file with your MongoDB Atlas connection string.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedDefaultUsers();
    app.listen(PORT, () => {
      console.log("Server running at http://localhost:" + PORT);
      console.log("Admin signup code (needed to register a new admin account): " + getAdminSignupCode());
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Check: 1) MONGO_URI is correct  2) Atlas Network Access allows this computer's IP  3) internet is working");
    process.exit(1);
  });
