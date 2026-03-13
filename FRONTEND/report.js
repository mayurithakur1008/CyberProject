const API_BASE = "http://localhost:8000";

const summaryEl = document.getElementById("summary-cards");
const targetEl = document.getElementById("scan-target");
const vulnTableEl = document.getElementById("vuln-table");
const checksEl = document.getElementById("checks");
const suggestionsEl = document.getElementById("suggestions");
const scoreLabel = document.getElementById("score-label");

const statusClass = (status) => {
  const value = status.toLowerCase();
  if (value.includes("pass")) return "pass";
  if (value.includes("fail")) return "fail";
  return "warn";
};

const severityClass = (severity) => {
  const value = severity.toLowerCase();
  if (value.includes("critical")) return "critical";
  if (value.includes("high")) return "high";
  if (value.includes("medium")) return "medium";
  return "low";
};

const renderSummary = (summary) => {
  summaryEl.innerHTML = "";
  const cards = [
    { label: "Total Endpoints Scanned", value: summary.endpoints },
    { label: "Critical Vulnerabilities", value: summary.critical, className: "critical" },
    { label: "High Vulnerabilities", value: summary.high, className: "high" },
    { label: "Medium Vulnerabilities", value: summary.medium, className: "warning" },
    { label: "Low Vulnerabilities", value: summary.low, className: "low" },
    { label: "Security Score", value: `${summary.score}%`, className: "score" },
  ];

  cards.forEach((card) => {
    const el = document.createElement("article");
    el.className = `card ${card.className || ""}`.trim();
    el.innerHTML = `<h3>${card.label}</h3><p class="metric">${card.value}</p>`;
    summaryEl.appendChild(el);
  });
};

const renderVulnTable = (vulnerabilities) => {
  vulnTableEl.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table-row table-head";
  header.innerHTML = `
    <span>Endpoint URL</span>
    <span>Type</span>
    <span>Severity</span>
    <span>Description</span>
    <span>Suggested Fix</span>
  `;
  vulnTableEl.appendChild(header);

  vulnerabilities.forEach((vuln) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <span>${vuln.endpoint}</span>
      <span>${vuln.type}</span>
      <span class="pill ${severityClass(vuln.severity)}">${vuln.severity}</span>
      <span>${vuln.description}</span>
      <span>${vuln.fix}</span>
    `;
    vulnTableEl.appendChild(row);
  });
};

const renderChecks = (checks) => {
  checksEl.innerHTML = "";
  checks.forEach((check) => {
    const row = document.createElement("div");
    row.className = "check";
    row.innerHTML = `
      <span>${check.name}</span>
      <span class="status ${statusClass(check.status)}">${check.status}</span>
    `;
    checksEl.appendChild(row);
  });
};

const renderSuggestions = (suggestions) => {
  suggestionsEl.innerHTML = "";
  suggestions.forEach((text) => {
    const card = document.createElement("div");
    card.className = "suggestion";
    card.textContent = text;
    suggestionsEl.appendChild(card);
  });
};

const renderCharts = (charts) => {
  const severityCtx = document.getElementById("severityChart");
  const endpointCtx = document.getElementById("endpointChart");
  const scoreCtx = document.getElementById("scoreChart");

  const severityData = charts.severity || {};
  const labels = ["Critical", "High", "Medium", "Low"];
  const values = labels.map((label) => severityData[label] || 0);

  new Chart(severityCtx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ["#ff4d4d", "#ff9a4d", "#ffd666", "#7dffb1"],
          borderColor: "rgba(8, 16, 30, 0.8)",
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#cfe3ff" } },
      },
    },
  });

  new Chart(endpointCtx, {
    type: "bar",
    data: {
      labels: charts.perEndpoint.map((item) => item.endpoint),
      datasets: [
        {
          data: charts.perEndpoint.map((item) => item.count),
          backgroundColor: "rgba(60, 231, 255, 0.6)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9fb8d4" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#9fb8d4" }, grid: { color: "rgba(255,255,255,0.05)" } },
      },
    },
  });

  const score = charts.score;
  scoreLabel.textContent = `${score}%`;

  new Chart(scoreCtx, {
    type: "doughnut",
    data: {
      labels: ["Score", "Remaining"],
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: ["#3ce7ff", "rgba(255,255,255,0.08)"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
};

const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get("reportId");
  if (!reportId) {
    targetEl.textContent = "Target: Not provided";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/report/${reportId}`);
    if (!response.ok) {
      throw new Error("Report not found");
    }
    const report = await response.json();

    const sanitized = report.target.replace(/^https?:\/\//, "").replace(/\/$/, "");
    targetEl.textContent = `Target: ${sanitized}`;
    renderSummary(report.summary);
    renderVulnTable(report.vulnerabilities);
    renderChecks(report.checks);
    renderSuggestions(report.suggestions);
    renderCharts(report.charts);
  } catch (error) {
    targetEl.textContent = "Target: Report unavailable";
  }
};

init();
