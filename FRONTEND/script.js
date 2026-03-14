const API_BASE = "http://localhost:8000";
const form = document.querySelector(".scan");
const input = document.querySelector(".scan input");
const statusEl = document.querySelector(".scan-status");
const button = document.querySelector(".scan button");

const setStatus = (message, isError = false) => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.state = isError ? "error" : "info";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = input.value.trim();
  if (!url) {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 400);
    setStatus("Paste a valid API URL to scan.", true);
    return;
  }

  setStatus("Scanning target. Generating report...", false);
  button.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error("Scan request failed.");
    }

    const data = await response.json();
    const reportId = data.reportId;
    if (data.report) {
      const sessionEmail = localStorage.getItem("cyberapi_session");
      const reportKey = sessionEmail ? `lastReport_${sessionEmail}` : "lastReport";
      const idKey = sessionEmail ? `lastReportId_${sessionEmail}` : "lastReportId";
      const historyKey = sessionEmail ? `scanHistory_${sessionEmail}` : "scanHistory";
      localStorage.setItem(reportKey, JSON.stringify(data.report));
      localStorage.setItem(idKey, reportId || "");

      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      history.unshift({
        id: reportId || "",
        target: data.report.target,
        summary: data.report.summary,
        report: data.report,
        createdAt: Date.now(),
      });
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    }
    window.location.href = `report.html?reportId=${encodeURIComponent(reportId)}`;
  } catch (error) {
    setStatus("Scanner backend is unavailable. Start the API service and try again.", true);
    button.disabled = false;
  }
});
