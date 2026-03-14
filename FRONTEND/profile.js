const historyEl = document.getElementById("history");
const subtitleEl = document.getElementById("profile-subtitle");

const sessionEmail = localStorage.getItem("cyberapi_session");
const historyKey = sessionEmail ? `scanHistory_${sessionEmail}` : "scanHistory";

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const renderHistory = () => {
  if (!sessionEmail) {
    subtitleEl.textContent = "Log in to view your scan history.";
    historyEl.innerHTML = '<p class="empty">No user session found.</p>';
    return;
  }

  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (!history.length) {
    historyEl.innerHTML = '<p class="empty">No scans saved yet.</p>';
    return;
  }

  historyEl.innerHTML = "";
  history.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <h3>${entry.target || "Unknown target"}</h3>
      <div class="history-meta">Saved: ${formatDate(entry.createdAt)}</div>
      <div class="history-meta">Score: ${entry.summary?.score ?? "-"}%</div>
      <button class="history-btn" data-index="${index}">View Report</button>
    `;
    historyEl.appendChild(card);
  });

  historyEl.querySelectorAll(".history-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = history[Number(btn.dataset.index)];
      if (!entry) return;
      const reportKey = sessionEmail ? `lastReport_${sessionEmail}` : "lastReport";
      localStorage.setItem(reportKey, JSON.stringify(entry.report));
      window.location.href = "report.html";
    });
  });
};

renderHistory();
