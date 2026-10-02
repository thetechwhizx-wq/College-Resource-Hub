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

function setupNav() {
  const user = getUser();
  const nameEl = document.getElementById("navUserName");
  if (nameEl && user) nameEl.textContent = user.name + " (" + user.role + ")";

  document.querySelectorAll(".admin-only").forEach(function (el) {
    el.style.display = user && user.role === "admin" ? "inline-block" : "none";
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
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

// =====================================================
// 3. HTML BUILDERS (turn one data item into a card)
// =====================================================

// bookmarkedIds: a Set of resource _id strings the current user already saved.
// Used so the Resources page can show a filled-in star on cards already bookmarked.
function resourceCardHtml(r, bookmarkedIds) {
  const link = safeUrl(r.link);
  const openBtn = link
    ? '<a class="btn" href="' + escapeHtml(link) + '" target="_blank" rel="noopener" data-view-id="' + r._id + '">Open / Download</a>'
    : '<span class="item-meta">No link added</span>';

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
  const link = safeUrl(r.link);
  const openBtn = link
    ? '<a class="btn" href="' + escapeHtml(link) + '" target="_blank" rel="noopener" data-view-id="' + r._id + '">Open / Download</a>'
    : '<span class="item-meta">No link added</span>';
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

    document.getElementById("statSubjects").textContent = subjects.length;
    document.getElementById("statResources").textContent = resources.length;
    document.getElementById("statAssignments").textContent = assignments.length;
    document.getElementById("statAnnouncements").textContent = announcements.length;

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
      alert(err.message);
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
      alert("Thanks — your report was sent to the admin.");
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
      alert(err.message);
    }
  });

  await load();
}

// =====================================================
// 9. ADMIN DASHBOARD (content CRUD + calendar CRUD + reports + analytics)
// =====================================================
function showAdminMessage(text, type) { showMessage(document.getElementById("adminMessage"), text, type); }

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
      const linkCell = link ? '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">Open</a>' : "-";
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
    document.getElementById("anStudents").textContent = a.totals.students;
    document.getElementById("anResources").textContent = a.totals.resources;
    document.getElementById("anViews").textContent = a.totals.totalViews;
    document.getElementById("anBookmarks").textContent = a.totals.totalBookmarks;
    document.getElementById("anOpenReports").textContent = a.openReports;

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
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(buildBody(form)) });
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
  setupAddForm("resourceForm", "/api/resources", function (f) {
    // Auto-fill semester from the chosen subject's <option data-semester="..."> so it always matches the Subject.
    const subjectSelect = document.getElementById("resourceSubject");
    const chosenOption = subjectSelect.options[subjectSelect.selectedIndex];
    return {
      title: f.elements["title"].value,
      subject: f.elements["subject"].value,
      semester: chosenOption ? Number(chosenOption.dataset.semester) : null,
      unit: f.elements["unit"].value,
      type: f.elements["type"].value,
      link: f.elements["link"].value
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
