// script.js - ONE script shared by every page.
// Each HTML page has <body data-page="..."> and the router at the bottom
// uses that value to decide which init function to run.

// =====================================================
// 1. CONFIG
// =====================================================
const usingLiveServer =
  window.location.protocol === "file:" ||
  ["5500", "5501", "5502", "5503"].includes(window.location.port);
const API_BASE = usingLiveServer ? "http://localhost:3000" : "";

// =====================================================
// 2. HELPER FUNCTIONS (small tools used everywhere)
// =====================================================

function getToken() { return localStorage.getItem("token"); }

function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch (err) { return null; }
}

function saveSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function redirectByRole(user) {
  window.location.href = user.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
}

// Page guard: kicks out visitors who are not logged in (or not the right role).
// NOTE: only for a smooth user experience. The REAL protection is on the server
// (verifyToken / adminOnly), since anyone can edit JavaScript in their own browser.
function requireLogin(requiredRole) {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = "login.html";
    return false;
  }
  if (requiredRole && user.role !== requiredRole) {
    alert("Access denied: this page is for " + requiredRole + "s only.");
    window.location.href = "dashboard.html";
    return false;
  }
  return true;
}

// ---------- App shell: sidebar + top bar are built here so every page shares ONE navigation ----------
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  clip: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  admin: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  cap: '<path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'
};

function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
}

const NAV_ITEMS = [
  { page: "dashboard", href: "dashboard.html", label: "Dashboard", icon: "dashboard" },
  { page: "resources", href: "resources.html", label: "Resources", icon: "book" },
  { page: "assignments", href: "assignments.html", label: "Assignments", icon: "clip" },
  { page: "announcements", href: "announcements.html", label: "Announcements", icon: "bell" },
  { page: "calendar", href: "calendar.html", label: "Calendar", icon: "calendar" },
  { page: "bookmarks", href: "bookmarks.html", label: "Bookmarks", icon: "bookmark" },
  { page: "admin", href: "admin-dashboard.html", label: "Admin Panel", icon: "admin", adminOnly: true }
];

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function setupNav() {
  const user = getUser();
  const page = document.body.dataset.page;
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  if (!sidebar || !topbar || !user) return;

  const isAdmin = user.role === "admin";
  const initials = user.name.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
  let title = "";

  const links = NAV_ITEMS
    .filter(function (item) { return !item.adminOnly || isAdmin; })
    .map(function (item) {
      if (item.page === page) title = item.label;
      return '<a class="side-link' + (item.page === page ? " active" : "") + '" href="' + item.href + '">' + icon(item.icon) + "<span>" + item.label + "</span></a>";
    })
    .join("");

  sidebar.innerHTML =
    '<div class="brand"><div class="brand-logo">' + icon("cap") + '</div><div>College Hub<small>Resource Portal</small></div></div>' +
    '<nav class="side-nav">' + links + "</nav>" +
    '<div class="side-footer">' +
      '<div class="user-chip"><div class="avatar">' + escapeHtml(initials) + '</div><div class="user-meta"><strong id="navUserName">' + escapeHtml(user.name) + "</strong><span>" + escapeHtml(user.role) + "</span></div></div>" +
      '<button id="logoutBtn" class="btn btn-ghost btn-small btn-block">' + icon("logout") + " Logout</button>" +
    "</div>";

  const dark = document.documentElement.dataset.theme === "dark";
  topbar.innerHTML =
    '<button id="menuBtn" class="icon-btn menu-btn" aria-label="Open menu">' + icon("menu") + "</button>" +
    '<div class="topbar-title">' + escapeHtml(title) + "</div>" +
    '<button id="themeBtn" class="icon-btn" aria-label="Toggle dark mode">' + icon(dark ? "sun" : "moon") + "</button>";

  // Mobile: slide the sidebar in/out
  let overlay = document.getElementById("sidebarOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }
  function setMenu(open) {
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("show", open);
  }
  document.getElementById("menuBtn").addEventListener("click", function () { setMenu(true); });
  overlay.addEventListener("click", function () { setMenu(false); });

  document.getElementById("themeBtn").addEventListener("click", function () {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    this.innerHTML = icon(next === "dark" ? "sun" : "moon");
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
}

// Wrapper around fetch(): adds the JWT header, handles errors in ONE place.
async function apiFetch(path, options) {
  options = options || {};
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body
    });
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const isAuthRoute = path.includes("/auth/login") || path.includes("/auth/register");
  if (response.status === 401 && !isAuthRoute) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
  element.style.display = "block";
}

// SECURITY: escape text before putting it into innerHTML so nobody can inject <script> tags (XSS)
function escapeHtml(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow real web links (blocks things like javascript:alert(1))
function safeUrl(url) {
  return /^https?:\/\//i.test(url || "") ? url : "";
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function formatDate(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString || "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function showLoadError(container, err) {
  container.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
}

// Small pop-up message in the corner (replaces ugly alert() boxes)
function toast(message, type) {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = "toast " + (type || "info");
  el.textContent = message;
  box.appendChild(el);
  function close() {
    el.classList.add("leaving");
    setTimeout(function () { el.remove(); }, 300);
  }
  el.addEventListener("click", close);
  setTimeout(close, 3500);
}

// Numbers count up from 0 to their value (a small "wow" touch on dashboards)
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  target = Number(target) || 0;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || target === 0) { el.textContent = target; return; }
  const duration = 800;
  const startTime = performance.now();
  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out: fast start, slow finish
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Elements with class "reveal" fade in when they scroll into view
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 3) * 90 + "ms";
    observer.observe(el);
  });
}

// PDFs are protected by the login token, so a plain <a href> cannot open them.
// Instead we fetch the file WITH the token, turn it into a temporary blob URL and open that.
document.addEventListener("click", async function (event) {
  const btn = event.target.closest("[data-file-id]");
  if (!btn) return;
  const win = window.open("", "_blank"); // open the tab right away so popup blockers allow it
  try {
    const response = await fetch(API_BASE + "/api/files/" + btn.dataset.fileId, {
      headers: { Authorization: "Bearer " + getToken() }
    });
    if (!response.ok) throw new Error("Could not load the PDF.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url; else window.location.href = url;
  } catch (err) {
    if (win) win.close();
    toast(err.message, "error");
  }
});

// Reads the PDF chosen in the admin form, validates it, uploads it, and returns { id, name } (or null if none chosen)
async function uploadSelectedPdf() {
  const input = document.getElementById("resourceFile");
  const file = input && input.files[0];
  if (!file) return null;
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Only PDF files are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("PDF is too large (max 5 MB).");

  const base64 = await new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(String(reader.result).split(",")[1]); }; // drop the "data:...;base64," prefix
    reader.onerror = function () { reject(new Error("Could not read the file.")); };
    reader.readAsDataURL(file);
  });
  return apiFetch("/api/files", { method: "POST", body: JSON.stringify({ name: file.name, data: base64 }) });
}

// "Open link" and "View PDF" buttons for a resource (shared by Resources + Bookmarks pages)
function resourceOpenButtons(r) {
  const link = safeUrl(r.link);
  let html = "";
  if (r.fileId) {
    html += '<button class="btn" data-file-id="' + escapeHtml(r.fileId) + '" data-view-id="' + r._id + '">' + icon("file") + " View PDF</button>";
  }
  if (link) {
    html += '<a class="btn ' + (r.fileId ? "btn-ghost" : "") + '" href="' + escapeHtml(link) + '" target="_blank" rel="noopener" data-view-id="' + r._id + '">Open link</a>';
  }
  return html || '<span class="item-meta">No file or link added</span>';
}

// =====================================================
// 3. HTML BUILDERS (turn one data item into a card)
// =====================================================

// bookmarkedIds: a Set of resource _id strings the current user already saved.
// Used so the Resources page can show a filled-in star on cards already bookmarked.
function resourceCardHtml(r, bookmarkedIds) {
  const openBtn = resourceOpenButtons(r);

  const isSaved = bookmarkedIds && bookmarkedIds.has(r._id);
  const bookmarkBtn =
    '<button class="bookmark-btn' + (isSaved ? " active" : "") + '" data-bookmark-id="' + r._id + '">' +
    (isSaved ? "\u2605 Saved" : "\u2606 Save") +
    "</button>";

  const reportBtn = '<button class="link-btn" data-report-id="' + r._id + '" data-report-title="' + escapeHtml(r.title) + '">Report issue</button>';

  return (
    '<div class="card">' +
      '<div class="item-title">' + escapeHtml(r.title) + "</div>" +
      '<p class="item-meta">' +
        '<span class="badge">' + escapeHtml(r.subject) + "</span>" +
        (r.semester ? '<span class="badge">Sem ' + escapeHtml(r.semester) + "</span>" : "") +
        (r.unit ? '<span class="badge">' + escapeHtml(r.unit) + "</span>" : "") +
        '<span class="badge">' + escapeHtml(r.type || "Notes") + "</span>" +
      "</p>" +
      '<div class="card-actions">' + openBtn + bookmarkBtn + "</div>" +
      '<div style="margin-top:8px">' + reportBtn + "</div>" +
    "</div>"
  );
}

// Bookmarks page: same info, but the action is "Remove" instead of a save toggle
function bookmarkCardHtml(r) {
  const openBtn = resourceOpenButtons(r);
  return (
    '<div class="card">' +
      '<div class="item-title">' + escapeHtml(r.title) + "</div>" +
      '<p class="item-meta"><span class="badge">' + escapeHtml(r.subject) + "</span>" +
      (r.unit ? '<span class="badge">' + escapeHtml(r.unit) + "</span>" : "") + "</p>" +
      '<div class="card-actions">' + openBtn +
      '<button class="bookmark-btn active" data-bookmark-id="' + r._id + '">\u2605 Remove</button>' +
      "</div>" +
    "</div>"
  );
}

function assignmentCardHtml(a) {
  const overdue = a.deadline < todayString();
  return (
    '<div class="card">' +
      '<div class="item-title">' + escapeHtml(a.title) + "</div>" +
      '<p class="item-meta"><span class="badge">' + escapeHtml(a.subject) + "</span></p>" +
      '<p class="item-meta" style="margin-top:6px">Deadline: ' + escapeHtml(formatDate(a.deadline)) +
      (overdue ? ' <span class="badge overdue">Overdue</span>' : "") + "</p>" +
    "</div>"
  );
}

function announcementCardHtml(a) {
  return (
    '<div class="card">' +
      '<div class="item-title">' + escapeHtml(a.title) + "</div>" +
      '<p class="item-meta">Posted on ' + escapeHtml(formatDate(a.date)) + "</p>" +
    "</div>"
  );
}

function calendarItemHtml(e) {
  const d = new Date(e.date + "T00:00:00");
  const day = isNaN(d.getTime()) ? "?" : d.getDate();
  const mon = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
  return (
    '<div class="card calendar-item">' +
      '<div class="calendar-date-box"><div class="day">' + day + '</div><div class="mon">' + escapeHtml(mon) + "</div></div>" +
      "<div>" +
        '<div class="item-title">' + escapeHtml(e.title) + "</div>" +
        '<p class="item-meta"><span class="badge cat-' + escapeHtml(e.category) + '">' + escapeHtml(e.category) + "</span></p>" +
        (e.description ? '<p class="item-meta" style="margin-top:4px">' + escapeHtml(e.description) + "</p>" : "") +
      "</div>" +
    "</div>"
  );
}

function sortAnnouncements(list) { return list.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }); }
function sortAssignments(list) { return list.slice().sort(function (a, b) { return a.deadline.localeCompare(b.deadline); }); }
function sortCalendarEvents(list) { return list.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }); }

function renderCards(container, items, builder, emptyText) {
  container.innerHTML = items.length ? items.map(builder).join("") : '<p class="empty">' + escapeHtml(emptyText) + "</p>";
  // Each card gets a small delay (--i) so they fade in one after another instead of all at once
  Array.from(container.children).forEach(function (el, i) { el.style.setProperty("--i", Math.min(i, 12)); });
}

// Fires a "view" ping to the server whenever an "Open / Download" link is clicked, for analytics.
// Delegated once on <body> so it works no matter which page/list drew the link.
document.addEventListener("click", function (event) {
  const link = event.target.closest("[data-view-id]");
  if (!link) return;
  apiFetch("/api/resources/" + link.dataset.viewId + "/view", { method: "POST" }).catch(function () {
    /* view tracking failing should never block the student from opening the resource */
  });
});

// =====================================================
// 4. LOGIN + REGISTER PAGE
// =====================================================
function initLoginPage() {
  const existingUser = getUser();
  if (getToken() && existingUser) { redirectByRole(existingUser); return; }

  // --- Tab switching ---
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabRegisterBtn = document.getElementById("tabRegisterBtn");
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");

  tabLoginBtn.addEventListener("click", function () {
    tabLoginBtn.classList.add("active");
    tabRegisterBtn.classList.remove("active");
    loginPanel.classList.remove("hidden");
    registerPanel.classList.add("hidden");
  });
  tabRegisterBtn.addEventListener("click", function () {
    tabRegisterBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
    registerPanel.classList.remove("hidden");
    loginPanel.classList.add("hidden");
  });

  // --- Login form ---
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    try {
      const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email: email, password: password }) });
      saveSession(data);
      redirectByRole(data.user);
    } catch (err) {
      showMessage(loginMessage, err.message, "error");
    }
  });

  // --- Register form ---
  const roleSelect = document.getElementById("regRole");
  const adminCodeField = document.getElementById("adminCodeField");
  roleSelect.addEventListener("change", function () {
    adminCodeField.classList.toggle("hidden", roleSelect.value !== "admin");
  });

  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const body = {
      name: document.getElementById("regName").value.trim(),
      email: document.getElementById("regEmail").value.trim(),
      password: document.getElementById("regPassword").value,
      role: roleSelect.value,
      adminCode: document.getElementById("regAdminCode").value
    };
    try {
      const data = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
      saveSession(data); // register also logs the new account straight in
      redirectByRole(data.user);
    } catch (err) {
      showMessage(registerMessage, err.message, "error");
    }
  });
}

// =====================================================
// 5. STUDENT DASHBOARD
// =====================================================
async function initDashboardPage() {
  const user = getUser();
  document.getElementById("welcomeName").textContent = user.name;

  const announcementBox = document.getElementById("latestAnnouncements");
  const assignmentBox = document.getElementById("upcomingAssignments");
  const calendarBox = document.getElementById("upcomingCalendar");

  try {
    const results = await Promise.all([
      apiFetch("/api/subjects"),
      apiFetch("/api/resources"),
      apiFetch("/api/assignments"),
      apiFetch("/api/announcements"),
      apiFetch("/api/calendar-events")
    ]);
    const subjects = results[0], resources = results[1], assignments = results[2], announcements = results[3], events = results[4];

    animateCount("statSubjects", subjects.length);
    animateCount("statResources", resources.length);
    animateCount("statAssignments", assignments.length);
    animateCount("statAnnouncements", announcements.length);

    renderCards(announcementBox, sortAnnouncements(announcements).slice(0, 3), announcementCardHtml, "No announcements yet.");

    const upcomingAssignments = sortAssignments(assignments).filter(function (a) { return a.deadline >= todayString(); });
    renderCards(assignmentBox, upcomingAssignments.slice(0, 3), assignmentCardHtml, "No upcoming deadlines.");

    const upcomingEvents = sortCalendarEvents(events).filter(function (e) { return e.date >= todayString(); });
    renderCards(calendarBox, upcomingEvents.slice(0, 3), calendarItemHtml, "No upcoming calendar events.");
  } catch (err) {
    showLoadError(announcementBox, err);
    showLoadError(assignmentBox, err);
    showLoadError(calendarBox, err);
  }
}

// =====================================================
// 6. RESOURCES PAGE (advanced search + filter + bookmark + report)
// =====================================================
let allResources = [];
let bookmarkedIds = new Set();

function applyResourceFilters() {
  const searchText = document.getElementById("searchInput").value.trim().toLowerCase();
  const semester = document.getElementById("semesterFilter").value;
  const subject = document.getElementById("subjectFilter").value;
  const unit = document.getElementById("unitFilter").value;
  const type = document.getElementById("typeFilter").value;

  const filtered = allResources.filter(function (r) {
    if (semester && String(r.semester) !== semester) return false;
    if (subject && r.subject !== subject) return false;
    if (unit && r.unit !== unit) return false;
    if (type && r.type !== type) return false;
    const searchable = (r.title + " " + r.subject + " " + (r.unit || "") + " " + (r.type || "")).toLowerCase();
    return searchable.includes(searchText);
  });

  document.getElementById("resultCount").textContent = filtered.length + " resource(s) found";
  renderCards(document.getElementById("resourceList"), filtered, function (r) { return resourceCardHtml(r, bookmarkedIds); }, "No resources match your search/filters.");
}

// Fills a <select> with unique, sorted values pulled out of a list
function fillDropdown(selectId, values, placeholder) {
  const select = document.getElementById(selectId);
  const unique = Array.from(new Set(values.filter(Boolean))).sort();
  select.innerHTML = '<option value="">' + placeholder + "</option>" +
    unique.map(function (v) { return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + "</option>"; }).join("");
}

async function initResourcesPage() {
  const listBox = document.getElementById("resourceList");
  try {
    const results = await Promise.all([apiFetch("/api/resources"), apiFetch("/api/subjects"), apiFetch("/api/bookmarks")]);
    allResources = results[0];
    const subjects = results[1];
    const myBookmarks = results[2];
    bookmarkedIds = new Set(myBookmarks.map(function (b) { return b.resource._id; }));

    const subjectNames = subjects.map(function (s) { return s.name; }).concat(allResources.map(function (r) { return r.subject; }));
    fillDropdown("subjectFilter", subjectNames, "All subjects");
    fillDropdown("unitFilter", allResources.map(function (r) { return r.unit; }), "All units");
    fillDropdown("typeFilter", allResources.map(function (r) { return r.type; }), "All types");

    const semesterSelect = document.getElementById("semesterFilter");
    for (let s = 1; s <= 8; s++) semesterSelect.innerHTML += '<option value="' + s + '">Semester ' + s + "</option>";

    ["searchInput", "semesterFilter", "subjectFilter", "unitFilter", "typeFilter"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", applyResourceFilters);
      document.getElementById(id).addEventListener("change", applyResourceFilters);
    });

    applyResourceFilters();
  } catch (err) {
    showLoadError(listBox, err);
  }

  // --- Bookmark toggle (event delegation: works for cards redrawn later too) ---
  document.getElementById("resourceList").addEventListener("click", async function (event) {
    const btn = event.target.closest("[data-bookmark-id]");
    if (!btn) return;
    const resourceId = btn.dataset.bookmarkId;
    try {
      if (bookmarkedIds.has(resourceId)) {
        await apiFetch("/api/bookmarks/" + resourceId, { method: "DELETE" });
        bookmarkedIds.delete(resourceId);
      } else {
        await apiFetch("/api/bookmarks", { method: "POST", body: JSON.stringify({ resourceId: resourceId }) });
        bookmarkedIds.add(resourceId);
      }
      applyResourceFilters(); // redraw so the star updates
    } catch (err) {
      toast(err.message, "error");
    }
  });

  // --- Report modal ---
  const modal = document.getElementById("reportModal");
  const reportForm = document.getElementById("reportForm");
  const reportMessage = document.getElementById("reportMessage");
  let reportingResourceId = null;

  document.getElementById("resourceList").addEventListener("click", function (event) {
    const btn = event.target.closest("[data-report-id]");
    if (!btn) return;
    reportingResourceId = btn.dataset.reportId;
    document.getElementById("reportResourceLabel").textContent = "Reporting: " + btn.dataset.reportTitle;
    reportMessage.style.display = "none";
    reportForm.reset();
    modal.classList.remove("hidden");
  });

  document.getElementById("reportCancelBtn").addEventListener("click", function () {
    modal.classList.add("hidden");
  });

  reportForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          resourceId: reportingResourceId,
          reason: document.getElementById("reportReason").value,
          comment: document.getElementById("reportComment").value
        })
      });
      modal.classList.add("hidden");
      toast("Thanks — your report was sent to the admin.", "success");
    } catch (err) {
      showMessage(reportMessage, err.message, "error");
    }
  });
}

// =====================================================
// 7. ASSIGNMENTS, ANNOUNCEMENTS & CALENDAR PAGES
// =====================================================
async function initAssignmentsPage() {
  const box = document.getElementById("assignmentList");
  try {
    const assignments = await apiFetch("/api/assignments");
    renderCards(box, sortAssignments(assignments), assignmentCardHtml, "No assignments yet.");
  } catch (err) { showLoadError(box, err); }
}

async function initAnnouncementsPage() {
  const box = document.getElementById("announcementList");
  try {
    const announcements = await apiFetch("/api/announcements");
    renderCards(box, sortAnnouncements(announcements), announcementCardHtml, "No announcements yet.");
  } catch (err) { showLoadError(box, err); }
}

async function initCalendarPage() {
  const box = document.getElementById("calendarList");
  try {
    const events = sortCalendarEvents(await apiFetch("/api/calendar-events"));
    if (!events.length) { box.innerHTML = '<p class="empty">No calendar events yet.</p>'; return; }

    // Group into "Month Year" sections so the page reads like a real calendar
    let html = "";
    let lastMonth = "";
    events.forEach(function (e) {
      const d = new Date(e.date + "T00:00:00");
      const monthLabel = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
      if (monthLabel !== lastMonth) {
        html += '<div class="calendar-month">' + escapeHtml(monthLabel) + "</div>";
        lastMonth = monthLabel;
      }
      html += calendarItemHtml(e);
    });
    box.innerHTML = '<div class="list">' + html + "</div>";
  } catch (err) { showLoadError(box, err); }
}

// =====================================================
// 8. BOOKMARKS PAGE
// =====================================================
async function initBookmarksPage() {
  const box = document.getElementById("bookmarkList");

  async function load() {
    try {
      const bookmarks = await apiFetch("/api/bookmarks");
      const resources = bookmarks.map(function (b) { return b.resource; });
      renderCards(box, resources, bookmarkCardHtml, "You haven't bookmarked any resources yet. Save some from the Resources page!");
    } catch (err) { showLoadError(box, err); }
  }

  box.addEventListener("click", async function (event) {
    const btn = event.target.closest("[data-bookmark-id]");
    if (!btn) return;
    try {
      await apiFetch("/api/bookmarks/" + btn.dataset.bookmarkId, { method: "DELETE" });
      await load(); // reload the list so the removed card disappears
    } catch (err) {
      toast(err.message, "error");
    }
  });

  await load();
}

// =====================================================
// 9. ADMIN DASHBOARD (content CRUD + calendar CRUD + reports + analytics)
// =====================================================
function showAdminMessage(text, type) { toast(text, type); }

function fillSubjectSelect(selectId, subjects) {
  const select = document.getElementById(selectId);
  if (!subjects.length) { select.innerHTML = '<option value="">Add a subject first</option>'; return; }
  select.innerHTML = subjects
    .map(function (s) { return '<option value="' + escapeHtml(s.name) + '" data-semester="' + s.semester + '">' + escapeHtml(s.name) + "</option>"; })
    .join("");
}

function deleteButtonHtml(type, id) {
  return '<button class="btn btn-danger delete-btn" data-type="' + type + '" data-id="' + escapeHtml(id) + '">Delete</button>';
}

function fillTable(bodyId, rows, colCount, emptyText) {
  document.getElementById(bodyId).innerHTML = rows.length ? rows.join("") : '<tr><td colspan="' + colCount + '" class="empty">' + escapeHtml(emptyText) + "</td></tr>";
}

async function loadAdminData() {
  try {
    const results = await Promise.all([
      apiFetch("/api/subjects"),
      apiFetch("/api/resources"),
      apiFetch("/api/assignments"),
      apiFetch("/api/announcements"),
      apiFetch("/api/calendar-events"),
      apiFetch("/api/reports")
    ]);
    const subjects = results[0].slice().sort(function (a, b) { return a.semester - b.semester; });
    const resources = results[1];
    const assignments = sortAssignments(results[2]);
    const announcements = sortAnnouncements(results[3]);
    const events = sortCalendarEvents(results[4]);
    const reports = results[5];

    fillSubjectSelect("resourceSubject", subjects);
    fillSubjectSelect("assignmentSubject", subjects);

    fillTable("subjectRows", subjects.map(function (s) {
      return "<tr><td>" + escapeHtml(s.name) + "</td><td>" + escapeHtml(s.semester) + "</td><td>" + deleteButtonHtml("subjects", s._id) + "</td></tr>";
    }), 3, "No subjects yet.");

    fillTable("resourceRows", resources.map(function (r) {
      const link = safeUrl(r.link);
      const parts = [];
      if (r.fileId) parts.push('<span class="badge">PDF</span>');
      if (link) parts.push('<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">Link</a>');
      const linkCell = parts.length ? parts.join(" ") : "-";
      return "<tr><td>" + escapeHtml(r.title) + "</td><td>" + escapeHtml(r.subject) + "</td><td>" + escapeHtml(r.semester || "-") + "</td><td>" +
        escapeHtml(r.unit) + "</td><td>" + escapeHtml(r.type) + "</td><td>" + escapeHtml(r.views) + "</td><td>" + linkCell + "</td><td>" +
        deleteButtonHtml("resources", r._id) + "</td></tr>";
    }), 8, "No resources yet.");

    fillTable("assignmentRows", assignments.map(function (a) {
      return "<tr><td>" + escapeHtml(a.title) + "</td><td>" + escapeHtml(a.subject) + "</td><td>" + escapeHtml(formatDate(a.deadline)) + "</td><td>" + deleteButtonHtml("assignments", a._id) + "</td></tr>";
    }), 4, "No assignments yet.");

    fillTable("announcementRows", announcements.map(function (a) {
      return "<tr><td>" + escapeHtml(a.title) + "</td><td>" + escapeHtml(formatDate(a.date)) + "</td><td>" + deleteButtonHtml("announcements", a._id) + "</td></tr>";
    }), 3, "No announcements yet.");

    fillTable("calendarRows", events.map(function (e) {
      return "<tr><td>" + escapeHtml(e.title) + "</td><td><span class=\"badge cat-" + escapeHtml(e.category) + "\">" + escapeHtml(e.category) + "</span></td><td>" +
        escapeHtml(formatDate(e.date)) + "</td><td>" + escapeHtml(e.description) + "</td><td>" + deleteButtonHtml("calendar-events", e._id) + "</td></tr>";
    }), 5, "No calendar events yet.");

    fillTable("reportRows", reports.map(function (r) {
      const statusBadge = '<span class="badge status-' + r.status + '">' + escapeHtml(r.status) + "</span>";
      const toggleLabel = r.status === "open" ? "Mark resolved" : "Reopen";
      const actions =
        '<button class="btn btn-small resolve-btn" data-id="' + r._id + '" data-next="' + (r.status === "open" ? "resolved" : "open") + '" style="background:var(--primary);color:#fff">' + toggleLabel + "</button> " +
        deleteButtonHtml("reports", r._id);
      return "<tr><td>" + escapeHtml(r.resourceTitle) + "</td><td>" + escapeHtml(r.reason) + "</td><td>" + escapeHtml(r.comment || "-") + "</td><td>" +
        escapeHtml(r.reporterName) + "</td><td>" + statusBadge + "</td><td>" + actions + "</td></tr>";
    }), 6, "No reports filed. Nice and clean!");
  } catch (err) {
    showAdminMessage(err.message, "error");
  }
}

async function loadAnalytics() {
  try {
    const a = await apiFetch("/api/analytics");
    animateCount("anStudents", a.totals.students);
    animateCount("anResources", a.totals.resources);
    animateCount("anViews", a.totals.totalViews);
    animateCount("anBookmarks", a.totals.totalBookmarks);
    animateCount("anOpenReports", a.openReports);

    document.getElementById("topResourcesBars").innerHTML = buildBarChart(
      a.topResources.map(function (r) { return { label: r.title, value: r.views }; }),
      "No resource opens recorded yet."
    );
    document.getElementById("subjectBars").innerHTML = buildBarChart(
      a.resourcesBySubject.map(function (s) { return { label: s.subject, value: s.count }; }),
      "No resources yet."
    );
  } catch (err) {
    document.getElementById("topResourcesBars").innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
  }
}

// Builds a simple CSS bar chart (width % of the fill = value / highest value) - no chart library needed.
function buildBarChart(items, emptyText) {
  if (!items.length) return '<p class="empty">' + escapeHtml(emptyText) + "</p>";
  const max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
  return items.map(function (i) {
    const pct = Math.round((i.value / max) * 100);
    return (
      '<div class="bar-row">' +
        '<div class="bar-label">' + escapeHtml(i.label) + "</div>" +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        "<div>" + escapeHtml(i.value) + "</div>" +
      "</div>"
    );
  }).join("");
}

function setDefaultDates() {
  document.getElementById("announcementDate").value = todayString();
  const calDate = document.getElementById("calendarDate");
  if (calDate) calDate.value = todayString();
}

function setupAddForm(formId, endpoint, buildBody) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(await buildBody(form)) });
      form.reset();
      setDefaultDates();
      showAdminMessage("Added successfully.", "success");
      await loadAdminData();
    } catch (err) {
      showAdminMessage(err.message, "error");
    }
  });
}

async function initAdminPage() {
  if (!requireLogin("admin")) return;
  setupNav();
  setDefaultDates();

  setupAddForm("subjectForm", "/api/subjects", function (f) {
    return { name: f.elements["name"].value, semester: Number(f.elements["semester"].value) };
  });
  setupAddForm("resourceForm", "/api/resources", async function (f) {
    const uploaded = await uploadSelectedPdf(); // null when no PDF was chosen
    // Auto-fill semester from the chosen subject's <option data-semester="..."> so it always matches the Subject.
    const subjectSelect = document.getElementById("resourceSubject");
    const chosenOption = subjectSelect.options[subjectSelect.selectedIndex];
    return {
      title: f.elements["title"].value,
      subject: f.elements["subject"].value,
      semester: chosenOption ? Number(chosenOption.dataset.semester) : null,
      unit: f.elements["unit"].value,
      type: f.elements["type"].value,
      link: f.elements["link"].value,
      fileId: uploaded ? uploaded.id : undefined,
      fileName: uploaded ? uploaded.name : ""
    };
  });
  setupAddForm("assignmentForm", "/api/assignments", function (f) {
    return { title: f.elements["title"].value, subject: f.elements["subject"].value, deadline: f.elements["deadline"].value };
  });
  setupAddForm("announcementForm", "/api/announcements", function (f) {
    return { title: f.elements["title"].value, date: f.elements["date"].value };
  });
  setupAddForm("calendarForm", "/api/calendar-events", function (f) {
    return { title: f.elements["title"].value, category: f.elements["category"].value, date: f.elements["date"].value, description: f.elements["description"].value };
  });

  // Delete buttons (event delegation, works for rows redrawn later too)
  document.addEventListener("click", async function (event) {
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      if (!confirm("Delete this item permanently?")) return;
      try {
        await apiFetch("/api/" + deleteBtn.dataset.type + "/" + deleteBtn.dataset.id, { method: "DELETE" });
        showAdminMessage("Deleted successfully.", "success");
        await loadAdminData();
        await loadAnalytics();
      } catch (err) {
        showAdminMessage(err.message, "error");
      }
      return;
    }

    const resolveBtn = event.target.closest(".resolve-btn");
    if (resolveBtn) {
      try {
        await apiFetch("/api/reports/" + resolveBtn.dataset.id, { method: "PUT", body: JSON.stringify({ status: resolveBtn.dataset.next }) });
        await loadAdminData();
        await loadAnalytics();
      } catch (err) {
        showAdminMessage(err.message, "error");
      }
    }
  });

  await loadAdminData();
  await loadAnalytics();
}

// =====================================================
// 10. PAGE ROUTER - runs when the page has finished loading
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.dataset.page;
  initReveal();

  if (page === "home") return;
  if (page === "login") { initLoginPage(); return; }
  if (page === "admin") { initAdminPage(); return; } // has its own guard (admin only)

  if (!requireLogin()) return;
  setupNav();

  if (page === "dashboard") initDashboardPage();
  if (page === "resources") initResourcesPage();
  if (page === "assignments") initAssignmentsPage();
  if (page === "announcements") initAnnouncementsPage();
  if (page === "calendar") initCalendarPage();
  if (page === "bookmarks") initBookmarksPage();
});
