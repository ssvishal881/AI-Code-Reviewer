import json
import subprocess
import tempfile
from pathlib import Path


def run_semgrep(code: str, file_name: str):
    project_root = Path(__file__).resolve().parents[3]
    safe_file_name = Path(file_name).name

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file = Path(temp_dir) / safe_file_name
            temp_file.write_text(code, encoding="utf-8")

            result = subprocess.run(
                [
                    "semgrep",
                    "--config=p/security-audit",
                    str(temp_file),
                    "--json",
                ],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                cwd=project_root,
                timeout=120,
            )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"Semgrep could not execute: {exc}") from exc

    if not result.stdout.strip():
        raise RuntimeError(
            f"Semgrep returned no output. Exit code: {result.returncode}. "
            f"Error: {result.stderr.strip()}"
        )

    try:
        semgrep_output = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Semgrep returned invalid JSON: {result.stderr.strip()}"
        ) from exc

    if semgrep_output.get("errors"):
        raise RuntimeError(f"Semgrep reported errors: {semgrep_output['errors']}")

    issues = []

    for finding in semgrep_output.get("results", []):
        extra = finding.get("extra", {})
        start = finding.get("start", {})
        metadata = extra.get("metadata", {})

        severity = str(extra.get("severity", "WARNING")).lower()
        severity_map = {
            "error": "high",
            "warning": "medium",
            "info": "low",
        }

        security_severity = metadata.get("security_severity") or metadata.get(
            "severity"
        )

        if security_severity:
            security_severity = str(security_severity).lower()
            if security_severity in {"critical", "high", "medium", "low"}:
                mapped_severity = security_severity
            else:
                mapped_severity = severity_map.get(severity, "medium")
        else:
            mapped_severity = severity_map.get(severity, "medium")

        suggestion = "Review the affected code and apply a secure implementation."
        if extra.get("fix"):
            suggestion = "Apply the security fix suggested by Semgrep."

        issues.append(
            {
                "category": "security",
                "severity": mapped_severity,
                "title": finding.get("check_id", "Semgrep security issue"),
                "file": file_name,
                "line": start.get("line", 1),
                "description": extra.get(
                    "message",
                    "Semgrep detected a potential security issue.",
                ),
                "suggestion": suggestion,
                "source": "Semgrep",
            }
        )

    return issues
