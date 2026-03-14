const messagesEl = document.getElementById("chat-messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-text");

const appendMessage = (text, role = "assistant") => {
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

const suggestionsMap = [
  {
    match: ["auth", "authentication", "jwt", "token"],
    reply: "Strengthen authentication: enforce short-lived tokens, rotate keys, and validate exp/iat on every request.",
  },
  {
    match: ["authorization", "access", "rbac", "idor"],
    reply: "Harden authorization: add per-resource access checks, use RBAC/ABAC, and deny by default.",
  },
  {
    match: ["rate", "throttle", "dos", "ddos"],
    reply: "Add rate limiting: enforce IP/user throttling, burst protection, and anomaly detection.",
  },
  {
    match: ["input", "validation", "payload", "schema"],
    reply: "Validate inputs: apply strict schema validation, sanitize inputs, and reject malformed payloads early.",
  },
  {
    match: ["sql", "injection", "xss", "sqli"],
    reply: "Prevent injection: use parameterized queries, encode output, and apply a WAF for critical endpoints.",
  },
  {
    match: ["data", "exposure", "pii", "sensitive"],
    reply: "Reduce data exposure: mask sensitive fields, minimize responses, and enforce encryption in transit and at rest.",
  },
  {
    match: ["error", "stack", "verbose"],
    reply: "Harden error handling: return generic errors to clients and log detailed traces server-side only.",
  },
];

const genericReplies = [
  "Prioritize critical issues first, then high-severity items, and verify fixes with a re-scan.",
  "Start with authentication and authorization checks, then validate input and enforce rate limits.",
  "Document remediation steps and track fixes per endpoint for faster verification.",
];

const cyberReply = (message) => {
  const lower = message.toLowerCase();
  for (const item of suggestionsMap) {
    if (item.match.some((key) => lower.includes(key))) {
      return item.reply;
    }
  }
  return genericReplies[Math.floor(Math.random() * genericReplies.length)];
};

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = inputEl.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  inputEl.value = "";
  appendMessage(cyberReply(message), "assistant");
});
