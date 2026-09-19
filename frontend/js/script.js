const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stops the page from reloading

    const role = document.getElementById("role").value;

    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  });
}
const assignmentsList = document.getElementById("assignmentsList");

if (assignmentsList) {
  fetch("http://localhost:3000/api/assignments")
    .then(response => response.json())
    .then(assignments => {
      assignments.forEach(assignment => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${assignment.title}</h3>
          <p>Subject: ${assignment.subject} | Deadline: ${assignment.deadline}</p>
        `;
        assignmentsList.appendChild(card);
      });
    })
    .catch(error => {
      console.error("Failed to load assignments:", error);
      assignmentsList.innerHTML = "<p>Could not load assignments. Is the backend running?</p>";
    });
}