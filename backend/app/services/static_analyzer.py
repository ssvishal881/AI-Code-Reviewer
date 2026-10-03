# import json
# import subprocess
# from pathlib import Path


# def run_eslint(code: str, file_name: str):
#     project_root = Path(__file__).resolve().parents[3]
#     frontend_dir = project_root / "frontend"

#     if not frontend_dir.exists():
#         raise RuntimeError(f"Frontend directory not found: {frontend_dir}")

#     safe_file_name = Path(file_name).name
#     stdin_file_name = str(frontend_dir / safe_file_name)

#     try:
#         result = subprocess.run(
#             [
#                 "npx",
#                 "--no-install",
#                 "eslint",
#                 "--stdin",
#                 "--stdin-filename",
#                 stdin_file_name,
#                 "--format",
#                 "json",
#             ],
#             input=code,
#             capture_output=True,
#             text=True,
#             cwd=frontend_dir,
#             timeout=60,
#         )
#     except (OSError, subprocess.TimeoutExpired) as exc:
#         raise RuntimeError(f"ESLint could not execute: {exc}") from exc

#     if not result.stdout.strip():
#         raise RuntimeError(
#             f"ESLint returned no output. Exit code: {result.returncode}. "
#             f"Error: {result.stderr.strip()}"
#         )

#     try:
#         eslint_output = json.loads(result.stdout)
#     except json.JSONDecodeError as exc:
#         raise RuntimeError(
#             f"ESLint returned invalid JSON: {result.stderr.strip()}"
#         ) from exc

#     issues = []

#     for file_result in eslint_output:
#         for message in file_result.get("messages", []):
#             issues.append(
#                 {
#                     "category": "quality",
#                     "severity": ("high" if message.get("severity") == 2 else "medium"),
#                     "title": message.get("ruleId") or "ESLint issue",
#                     "file": file_name,
#                     "line": message.get("line", 1),
#                     "description": message.get("message", ""),
#                     "suggestion": "Review and fix this ESLint issue.",
#                     "source": "ESLint",
#                 }
#             )

#     if result.returncode != 0 and not issues:
#         raise RuntimeError(
#             f"ESLint failed without reporting issues: {result.stderr.strip()}"
#         )

#     return issues


import json
import shutil
import subprocess
from pathlib import Path


def run_eslint(code: str, file_name: str):
    project_root = Path(__file__).resolve().parents[3]
    frontend_dir = project_root / "frontend"
    eslint_cli = frontend_dir / "node_modules" / "eslint" / "bin" / "eslint.js"

    if not frontend_dir.is_dir():
        raise RuntimeError(f"Frontend directory not found: {frontend_dir}")

    if not eslint_cli.is_file():
        raise RuntimeError(f"ESLint executable not found: {eslint_cli}")

    node_executable = shutil.which("node")

    if not node_executable:
        raise RuntimeError(
            "Node.js was not found in PATH. Make sure Node.js is installed "
            "and restart the backend terminal."
        )

    safe_file_name = Path(file_name).name or "code.js"
    stdin_file_name = str(frontend_dir / safe_file_name)

    command = [
        node_executable,
        str(eslint_cli),
        "--stdin",
        "--stdin-filename",
        stdin_file_name,
        "--format",
        "json",
    ]

    try:
        result = subprocess.run(
            command,
            input=code,
            capture_output=True,
            text=True,
            cwd=str(frontend_dir),
            timeout=60,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("ESLint timed out after 60 seconds.") from exc
    except OSError as exc:
        raise RuntimeError(f"ESLint could not execute: {exc}") from exc

    if not result.stdout.strip():
        raise RuntimeError(
            f"ESLint returned no output. Exit code: {result.returncode}. "
            f"Error: {result.stderr.strip()}"
        )

    try:
        eslint_output = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"ESLint returned invalid JSON. Error: {result.stderr.strip()}"
        ) from exc

    if not isinstance(eslint_output, list):
        raise RuntimeError("ESLint returned an unexpected JSON structure.")

    issues = []

    for file_result in eslint_output:
        for message in file_result.get("messages", []):
            issues.append(
                {
                    "category": "quality",
                    "severity": ("high" if message.get("severity") == 2 else "medium"),
                    "title": message.get("ruleId") or "ESLint issue",
                    "file": file_name,
                    "line": message.get("line", 1),
                    "description": message.get("message", ""),
                    "suggestion": "Review and fix this ESLint issue.",
                    "source": "ESLint",
                }
            )

    if result.returncode != 0 and not issues:
        raise RuntimeError(
            f"ESLint failed without reporting issues: {result.stderr.strip()}"
        )

    return issues
