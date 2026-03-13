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
    window.location.href = `report.html?reportId=${encodeURIComponent(reportId)}`;
  } catch (error) {
    setStatus("Scanner backend is unavailable. Start the API service and try again.", true);
    button.disabled = false;
  }
});
