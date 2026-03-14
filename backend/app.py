from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import hashlib
import random
import time
import uuid

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    url: HttpUrl

REPORTS = {}

SEVERITIES = ["Critical", "High", "Medium", "Low"]

VULN_TYPES = [
    "Broken Authentication",
    "Injection",
    "Rate Limiting",
    "Sensitive Data Exposure",
    "Input Validation",
    "Insecure Direct Object Reference",
    "Security Misconfiguration",
    "Excessive Data Exposure",
]

FIXES = {
    "Broken Authentication": "Enforce JWT expiry, rotate keys, and implement MFA.",
    "Injection": "Use parameterized queries and strict input sanitization.",
    "Rate Limiting": "Apply IP/user throttling and burst protection.",
    "Sensitive Data Exposure": "Mask secrets, encrypt data, and minimize payloads.",
    "Input Validation": "Validate payload schemas and reject malformed input.",
    "Insecure Direct Object Reference": "Add access control checks per resource.",
    "Security Misconfiguration": "Harden configs and remove verbose errors.",
    "Excessive Data Exposure": "Restrict fields and implement response filtering.",
}

CHECKS = [
    "Authentication Check",
    "Authorization Check",
    "Rate Limit Detection",
    "Sensitive Data Exposure",
    "Input Validation Testing",
]

ENDPOINTS = [
    "/v1/auth/token",
    "/v1/users/search",
    "/v1/profile",
    "/v1/admin/audit",
    "/v1/payments/charge",
    "/v2/files/upload",
    "/v2/notifications",
    "/v2/usage/metrics",
]


def seeded_rng(value: str) -> random.Random:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    seed = int(digest[:16], 16)
    return random.Random(seed)


def build_report(url: str) -> dict:
    rng = seeded_rng(url)

    endpoint_count = rng.randint(24, 180)
    picked_endpoints = rng.sample(ENDPOINTS, k=rng.randint(4, len(ENDPOINTS)))

    vulnerabilities = []
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    vulns_per_endpoint = {}

    for endpoint in picked_endpoints:
        count = rng.randint(1, 4)
        for _ in range(count):
            severity = rng.choices(
                population=SEVERITIES,
                weights=[0.12, 0.22, 0.36, 0.30],
                k=1,
            )[0]
            vuln_type = rng.choice(VULN_TYPES)
            description = f"{vuln_type} detected on {endpoint}."
            vulnerabilities.append(
                {
                    "endpoint": endpoint,
                    "type": vuln_type,
                    "severity": severity,
                    "description": description,
                    "fix": FIXES.get(vuln_type, "Apply recommended security hardening."),
                }
            )
            severity_counts[severity] += 1
            vulns_per_endpoint[endpoint] = vulns_per_endpoint.get(endpoint, 0) + 1

    critical = severity_counts["Critical"]
    high = severity_counts["High"]
    medium = severity_counts["Medium"]
    low = severity_counts["Low"]

    score = max(0, 100 - (critical * 12 + high * 7 + medium * 4 + low * 2))

    checks = []
    for check in CHECKS:
        status = rng.choices(["Passed", "Failed", "At Risk"], weights=[0.55, 0.25, 0.2], k=1)[0]
        checks.append({"name": check, "status": status})

    suggestions = []
    if critical or high:
        suggestions.append("Enable strong authentication and rotate secrets regularly.")
    if any(c["status"] != "Passed" for c in checks if c["name"] == "Rate Limit Detection"):
        suggestions.append("Implement adaptive rate limiting and request throttling.")
    if any(c["status"] != "Passed" for c in checks if c["name"] == "Input Validation Testing"):
        suggestions.append("Add schema validation and reject malformed payloads early.")
    if any(v["type"] == "Sensitive Data Exposure" for v in vulnerabilities):
        suggestions.append("Mask sensitive fields and enforce encryption in transit and at rest.")
    if not suggestions:
        suggestions.append("Maintain current controls and run continuous monitoring.")

    endpoints_bar = [
        {"endpoint": endpoint, "count": vulns_per_endpoint.get(endpoint, 0)}
        for endpoint in picked_endpoints
    ]

    return {
        "target": url,
        "summary": {
            "endpoints": endpoint_count,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "score": score,
        },
        "vulnerabilities": vulnerabilities,
        "checks": checks,
        "charts": {
            "severity": severity_counts,
            "perEndpoint": endpoints_bar,
            "score": score,
        },
        "suggestions": suggestions,
        "generatedAt": int(time.time()),
    }


@app.post("/scan")
def scan(request: ScanRequest):
    report_id = str(uuid.uuid4())
    report = build_report(str(request.url))
    REPORTS[report_id] = report
    return {"reportId": report_id, "report": report}


@app.get("/report/{report_id}")
def get_report(report_id: str):
    report = REPORTS.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
