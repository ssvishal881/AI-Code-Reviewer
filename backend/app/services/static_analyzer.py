import json
import subprocess
import tempfile
from pathlib import Path


def run_eslint(code: str, file_name: str):
    project_root = Path(__file__).resolve().parents[3]
    frontend_dir = project_root / "frontend"

    safe_file_name = Path(file_name).name

    # Create the temporary file inside the frontend project
    with tempfile.TemporaryDirectory(dir=frontend_dir) as temp_dir:
        temp_file = Path(temp_dir) / safe_file_name

        temp_file.write_text(
            code,
            encoding="utf-8",
        )

        result = subprocess.run(
            [
                "npx",
                "eslint",
                "--stdin",
                "--stdin-filename",
                file_name,
                "--format",
                "json",
            ],
            input=code,
            capture_output=True,
            text=True,
            cwd=frontend_dir,
        )

        print("ESLint stdout:", result.stdout)
        print("ESLint stderr:", result.stderr)

        if not result.stdout:
            return []

        try:
            eslint_output = json.loads(result.stdout)
        except json.JSONDecodeError:
            return []

        issues = []

        for file_result in eslint_output:
            for message in file_result.get("messages", []):
                issues.append(
                    {
                        "category": "quality",
                        "severity": (
                            "high" if message.get("severity") == 2 else "medium"
                        ),
                        "title": message.get("ruleId") or "ESLint issue",
                        "file": file_name,
                        "line": message.get("line", 1),
                        "description": message.get("message", ""),
                        "suggestion": "Review and fix this ESLint issue.",
                        "source": "ESLint",
                    }
                )

        return issues
