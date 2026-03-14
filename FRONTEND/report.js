const API_BASE = "http://localhost:8000";

const summaryEl = document.getElementById("summary-cards");
const targetEl = document.getElementById("scan-target");
const vulnTableEl = document.getElementById("vuln-table");
const checksEl = document.getElementById("checks");
const suggestionsEl = document.getElementById("suggestions");
const scoreLabel = document.getElementById("score-label");
const zoomControls = document.querySelector(".zoom-controls");
const layoutButtons = document.querySelectorAll(".layout-btn");

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
    el.className = `card clickable ${card.className || ""}`.trim();
    el.dataset.zoom = "summary";
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
    row.className = "table-row clickable";
    row.dataset.zoom = "vulnerabilities";
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
    row.className = "check clickable";
    row.dataset.zoom = "checks";
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
    card.className = "suggestion clickable";
    card.dataset.zoom = "suggestions";
    card.textContent = text;
    suggestionsEl.appendChild(card);
  });
};

const renderCharts = (charts) => {
  const severityCtx = document.getElementById("severityChart");
  const endpointCtx = document.getElementById("endpointChart");
  const scoreCtx = document.getElementById("scoreChart");
  const trendCtx = document.getElementById("trendChart");
  const latencyCtx = document.getElementById("latencyChart");

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
      responsive: true,
      maintainAspectRatio: true,
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
      responsive: true,
      maintainAspectRatio: true,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });

  const trendLabels = ["Scan 1", "Scan 2", "Scan 3", "Scan 4", "Scan 5", "Scan 6", "Scan 7"];
  const trendValues = trendLabels.map((_, index) => Math.max(10, score - (6 - index) * 4));

  new Chart(trendCtx, {
    type: "line",
    data: {
      labels: trendLabels,
      datasets: [
        {
          data: trendValues,
          borderColor: "#3ce7ff",
          backgroundColor: "rgba(60, 231, 255, 0.15)",
          tension: 0.35,
          fill: true,
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

  const latencyLabels = charts.perEndpoint.map((item) => item.endpoint);
  const latencyValues = latencyLabels.map((_, index) => 80 + index * 12 + (index % 3) * 25);

  new Chart(latencyCtx, {
    type: "bar",
    data: {
      labels: latencyLabels,
      datasets: [
        {
          data: latencyValues,
          backgroundColor: "rgba(125, 255, 177, 0.6)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9fb8d4" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#9fb8d4" }, grid: { color: "rgba(255,255,255,0.05)" }, title: { display: true, text: "ms", color: "#9fb8d4" } },
      },
    },
  });
};

const demoReport = () => ({
  target: "demo.api/security",
  summary: {
    endpoints: 96,
    critical: 2,
    high: 5,
    medium: 9,
    low: 14,
    score: 78,
  },
  vulnerabilities: [
    {
      endpoint: "/v1/auth/token",
      type: "Broken Authentication",
      severity: "Critical",
      description: "Token accepted without exp validation.",
      fix: "Validate exp/iat and rotate signing keys.",
    },
    {
      endpoint: "/v1/users/search",
      type: "Injection",
      severity: "High",
      description: "Unparameterized query exposure.",
      fix: "Use parameterized queries and sanitize input.",
    },
    {
      endpoint: "/v2/files/upload",
      type: "Input Validation",
      severity: "Medium",
      description: "Missing file type validation.",
      fix: "Validate MIME types and enforce size limits.",
    },
    {
      endpoint: "/v1/profile",
      type: "Data Exposure",
      severity: "Low",
      description: "Verbose error reveals stack traces.",
      fix: "Return generic errors and log internally.",
    },
  ],
  checks: [
    { name: "Authentication Check", status: "Failed" },
    { name: "Authorization Check", status: "At Risk" },
    { name: "Rate Limit Detection", status: "Passed" },
    { name: "Sensitive Data Exposure", status: "At Risk" },
    { name: "Input Validation Testing", status: "Passed" },
  ],
  charts: {
    severity: { Critical: 2, High: 5, Medium: 9, Low: 14 },
    perEndpoint: [
      { endpoint: "/v1/auth/token", count: 3 },
      { endpoint: "/v1/users/search", count: 4 },
      { endpoint: "/v2/files/upload", count: 2 },
      { endpoint: "/v1/profile", count: 1 },
    ],
    score: 78,
  },
  suggestions: [
    "Enforce strong authentication with short-lived tokens.",
    "Implement input validation and parameterized queries.",
    "Add adaptive rate limiting and anomaly detection.",
  ],
});

const renderReport = (report) => {
  const sanitized = report.target.replace(/^https?:\/\//, "").replace(/\/$/, "");
  targetEl.textContent = `Target: ${sanitized}`;
  renderSummary(report.summary);
  renderVulnTable(report.vulnerabilities);
  renderChecks(report.checks);
  renderSuggestions(report.suggestions);
  renderCharts(report.charts);
  wireZoom();
};

const sections = [];
let currentIndex = -1;

const collectSections = () => {
  const order = ["summary", "charts", "vulnerabilities", "suggestions", "checks"];
  order.forEach((key) => {
    const section = document.querySelector(`[data-section="${key}"]`);
    if (section) sections.push(section);
  });
};

const openSection = (index) => {
  if (!sections.length) return;
  if (index < 0) index = 0;
  if (index >= sections.length) index = sections.length - 1;

  const current = document.querySelector(".section-zoom");
  if (current) current.classList.remove("section-zoom");

  currentIndex = index;
  const section = sections[currentIndex];
  section.classList.add("section-zoom");
  section.scrollTop = 0;
  document.body.classList.add("zooming");
  zoomControls.setAttribute("aria-hidden", "false");

  const prevBtn = zoomControls.querySelector('[data-zoom-action="prev"]');
  const nextBtn = zoomControls.querySelector('[data-zoom-action="next"]');
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === sections.length - 1;
};

const closeZoom = () => {
  const current = document.querySelector(".section-zoom");
  if (current) current.classList.remove("section-zoom");
  document.body.classList.remove("zooming");
  zoomControls.setAttribute("aria-hidden", "true");
  currentIndex = -1;
};

const wireZoom = () => {
  collectSections();

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-zoom-action]");
    if (action) {
      const type = action.dataset.zoomAction;
      if (type === "close") closeZoom();
      if (type === "prev") openSection(currentIndex - 1);
      if (type === "next") openSection(currentIndex + 1);
      return;
    }

    const target = event.target.closest("[data-zoom]");
    if (!target) return;
    const sectionId = target.dataset.zoom;
    const index = sections.findIndex((section) => section.dataset.section === sectionId);
    if (index >= 0) openSection(index);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeZoom();
    if (event.key === "ArrowRight") openSection(currentIndex + 1);
    if (event.key === "ArrowLeft") openSection(currentIndex - 1);
  });
};

const setLayout = (mode) => {
  const isStacked = mode === "stack";
  document.body.classList.toggle("layout-stacked", isStacked);
  document.body.classList.toggle("layout-side", !isStacked);
  layoutButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === mode);
  });
  localStorage.setItem("reportLayout", mode);
};

const init = async () => {
  const savedLayout = localStorage.getItem("reportLayout") || "side";
  setLayout(savedLayout);

  const params = new URLSearchParams(window.location.search);
  const reportId = params.get("reportId");
  const sessionEmail = localStorage.getItem("cyberapi_session");
  const reportKey = sessionEmail ? `lastReport_${sessionEmail}` : "lastReport";
  const idKey = sessionEmail ? `lastReportId_${sessionEmail}` : "lastReportId";
  if (!reportId) {
    const cached = localStorage.getItem(reportKey);
    if (cached) {
      renderReport(JSON.parse(cached));
      return;
    }
    renderReport(demoReport());
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/report/${reportId}`);
    if (!response.ok) {
      throw new Error("Report not found");
    }
    const report = await response.json();

    localStorage.setItem(reportKey, JSON.stringify(report));
    localStorage.setItem(idKey, reportId);
    renderReport(report);
  } catch (error) {
    const cached = localStorage.getItem(reportKey);
    if (cached) {
      renderReport(JSON.parse(cached));
      return;
    }
    renderReport(demoReport());
  }
};

init();

layoutButtons.forEach((btn) => {
  btn.addEventListener("click", () => setLayout(btn.dataset.layout));
});
