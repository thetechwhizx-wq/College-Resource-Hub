const express = require("express");
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("College Resource Hub backend is running!");
});

app.get("/api/subjects", (req, res) => {
  const subjects = [
    { id: 1, name: "Data Structures", semester: 4 },
    { id: 2, name: "DBMS", semester: 4 },
    { id: 3, name: "Operating Systems", semester: 4 },
    { id: 4, name: "Computer Networks", semester: 4} 
  ];
  // This needs to be right here to close out the subjects route!
  res.json(subjects);
});

app.get("/api/resources", (req, res) => {
  const resources = [
    { id: 1, title: "Data Structures Notes", subject: "Data Structures", unit: "Unit 2" },
    { id: 2, title: "DBMS ER Diagram Guide", subject: "DBMS", unit: "Unit 1" }
  ];
  res.json(resources);
});

app.get("/api/assignments", (req, res) => {
  const assignments = [
    { id: 1, title: "DBMS Assignment 1 - ER Diagrams", subject: "DBMS", deadline: "2026-09-20" },
    { id: 2, title: "Data Structures - Linked List Implementation", subject: "Data Structures", deadline: "2026-09-25" }
  ];
  res.json(assignments);
});

app.get("/api/announcements", (req, res) => {
  const announcements = [
    { id: 1, title: "Semester Exam Timetable Released", date: "2026-09-09" },
    { id: 2, title: "College Fest Registrations Open", date: "2026-09-05" }
  ];
  res.json(announcements);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});