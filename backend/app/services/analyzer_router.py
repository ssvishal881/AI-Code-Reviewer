from pathlib import Path

JS_TS_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
}

SEMGREP_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".go",
    ".php",
    ".ruby",
}

AI_ONLY_EXTENSIONS = {
    ".css",
    ".scss",
    ".html",
    ".json",
    ".md",
}

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".bmp",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".mp3",
    ".mp4",
    ".zip",
    ".pdf",
}


def get_analyzers(file_name: str) -> list[str]:
    extension = Path(file_name).suffix.lower()

    if extension in BINARY_EXTENSIONS:
        return []

    analyzers = ["ai"]

    if extension in JS_TS_EXTENSIONS:
        analyzers.append("eslint")

    if extension in SEMGREP_EXTENSIONS:
        analyzers.append("semgrep")

    return analyzers
