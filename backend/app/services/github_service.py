import os
import httpx
import base64
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = "https://api.github.com"


def github_headers():
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN is not configured")

    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def get_github_user():
    response = httpx.get(
        f"{GITHUB_API_URL}/user",
        headers=github_headers(),
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def get_github_repositories():
    response = httpx.get(
        f"{GITHUB_API_URL}/user/repos",
        headers=github_headers(),
        params={
            "sort": "updated",
            "direction": "desc",
            "per_page": 100,
        },
        timeout=10,
    )

    response.raise_for_status()

    repositories = response.json()

    return [
        {
            "id": repository.get("id"),
            "name": repository.get("name"),
            "full_name": repository.get("full_name"),
            "owner": repository.get("owner", {}).get("login"),
            "private": repository.get("private", False),
            "description": repository.get("description"),
            "html_url": repository.get("html_url"),
            "default_branch": repository.get(
                "default_branch",
                "main",
            ),
        }
        for repository in repositories
    ]


def get_pull_request_files(
    owner: str,
    repo: str,
    pull_number: int,
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/pulls/{pull_number}/files"

    response = httpx.get(
        url,
        headers=github_headers(),
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def get_pull_request_changes(
    owner: str,
    repo: str,
    pull_number: int,
):
    files = get_pull_request_files(
        owner,
        repo,
        pull_number,
    )

    changes = []

    for file in files:
        changes.append(
            {
                "file": file.get("filename"),
                "status": file.get("status"),
                "additions": file.get("additions", 0),
                "deletions": file.get("deletions", 0),
                "patch": file.get("patch", ""),
            }
        )

    return changes


def get_file_content(
    owner: str,
    repo: str,
    file_path: str,
    ref: str,
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/contents/{file_path}"

    response = httpx.get(
        url,
        headers=github_headers(),
        params={"ref": ref},
        timeout=10,
    )

    response.raise_for_status()

    file_data = response.json()

    encoded_content = file_data.get("content", "")
    encoded_content = encoded_content.replace("\n", "")

    decoded_content = base64.b64decode(encoded_content).decode("utf-8")

    return decoded_content


def get_pull_request(
    owner: str,
    repo: str,
    pull_number: int,
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/pulls/{pull_number}"

    response = httpx.get(
        url,
        headers=github_headers(),
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def get_pull_request_file_contents(
    owner: str,
    repo: str,
    pull_number: int,
):
    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
    )

    ref = pull_request["head"]["sha"]

    changes = get_pull_request_changes(
        owner,
        repo,
        pull_number,
    )

    files = []

    for change in changes:
        file_path = change["file"]
        status = change.get("status")

        if status == "removed":
            files.append(
                {
                    **change,
                    "commit": ref,
                    "content": "",
                    "reviewable": False,
                    "reason": "File was deleted.",
                }
            )
            continue

        try:
            content = get_file_content(
                owner=owner,
                repo=repo,
                file_path=file_path,
                ref=ref,
            )

            files.append(
                {
                    **change,
                    "commit": ref,
                    "content": content,
                    "reviewable": True,
                    "reason": None,
                }
            )

        except Exception as error:
            print(f"Could not fetch {file_path}: {error}")

            files.append(
                {
                    **change,
                    "commit": ref,
                    "content": "",
                    "reviewable": False,
                    "reason": ("File content could not be retrieved."),
                }
            )

    return files


def get_pull_request_comments(
    owner: str,
    repo: str,
    pull_number: int,
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/issues/" f"{pull_number}/comments"

    response = httpx.get(
        url,
        headers=github_headers(),
        params={"per_page": 100},
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def find_ai_review_comment(
    owner: str,
    repo: str,
    pull_number: int,
):
    comments = get_pull_request_comments(
        owner,
        repo,
        pull_number,
    )

    marker = "<!-- ai-code-reviewer -->"

    for comment in comments:
        body = comment.get("body", "")

        if marker in body:
            return comment

    return None


def update_pull_request_comment(
    owner: str,
    repo: str,
    comment_id: int,
    body: str,
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/issues/comments/" f"{comment_id}"

    response = httpx.patch(
        url,
        headers=github_headers(),
        json={"body": body},
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def create_or_update_ai_review_comment(
    owner: str,
    repo: str,
    pull_number: int,
    body: str,
):
    existing_comment = find_ai_review_comment(
        owner,
        repo,
        pull_number,
    )

    if existing_comment:
        return update_pull_request_comment(
            owner=owner,
            repo=repo,
            comment_id=existing_comment["id"],
            body=body,
        )

    return post_pull_request_comment(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        body=body,
    )


def get_github_pull_requests(owner: str, repo: str):
    response = httpx.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/pulls",
        headers=github_headers(),
        params={
            "state": "open",
            "sort": "updated",
            "direction": "desc",
            "per_page": 100,
        },
        timeout=10,
    )
    response.raise_for_status()

    pull_requests = response.json()

    return [
        {
            "id": pull_request.get("id"),
            "number": pull_request.get("number"),
            "title": pull_request.get("title"),
            "state": pull_request.get("state"),
            "user": pull_request.get("user", {}).get("login"),
            "created_at": pull_request.get("created_at"),
            "updated_at": pull_request.get("updated_at"),
            "html_url": pull_request.get("html_url"),
            "draft": pull_request.get("draft", False),
        }
        for pull_request in pull_requests
    ]


def create_pull_request_review_comment(
    owner: str,
    repo: str,
    pull_number: int,
    body: str,
    commit_id: str,
    path: str,
    line: int,
    side: str = "RIGHT",
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/pulls/{pull_number}/comments"

    response = httpx.post(
        url,
        headers=github_headers(),
        json={
            "body": body,
            "commit_id": commit_id,
            "path": path,
            "line": line,
            "side": side,
        },
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def prepare_inline_review_comments(
    owner: str,
    repo: str,
    pull_number: int,
    files: list,
    issues: list,
):
    pull_request = get_pull_request(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
    )

    commit_id = pull_request["head"]["sha"]
    comments = []
    file_map = {file.get("file"): file for file in files}

    for issue in issues:
        file_name = issue.get("file")
        line = issue.get("line")

        if not file_name or not line:
            continue

        file = file_map.get(file_name)

        if not file:
            continue

        patch = file.get("patch", "")

        changed_lines = get_patch_line_numbers(patch)

        if line not in changed_lines:
            print(
                f"Skipping inline comment for "
                f"{file_name}:{line} because the line "
                f"is not part of the PR diff."
            )
            continue

        body = (
            f"**{issue.get('severity', 'INFO').upper()}**: "
            f"{issue.get('title', 'Code issue')}\n\n"
            f"{issue.get('description', '')}\n\n"
            f"**Suggestion:** {issue.get('suggestion', '')}\n\n"
            f"Source: `{issue.get('source', 'AI')}`"
        )

        comments.append(
            {
                "path": file_name,
                "line": line,
                "side": "RIGHT",
                "body": body,
            }
        )

    return {
        "commit_id": commit_id,
        "comments": comments,
    }


def get_patch_line_numbers(patch: str):
    changed_lines = set()

    if not patch:
        return changed_lines

    current_line = None

    for line in patch.splitlines():
        if line.startswith("@@"):
            parts = line.split(" ")

            new_part = next(part for part in parts if part.startswith("+"))

            new_range = new_part[1:]

            if "," in new_range:
                start, _ = new_range.split(",", 1)
            else:
                start = new_range

            current_line = int(start)
            continue

        if current_line is None:
            continue

        if line.startswith("+") and not line.startswith("+++"):
            changed_lines.add(current_line)
            current_line += 1
            continue

        if line.startswith("-") and not line.startswith("---"):
            continue

        current_line += 1

    return changed_lines


def create_inline_review_comments(
    owner: str,
    repo: str,
    pull_number: int,
    files: list,
    issues: list,
):
    pull_request = get_pull_request(
        owner,
        repo,
        pull_number,
    )

    commit_id = pull_request["head"]["sha"]

    comments = []
    seen = set()

    for issue in issues:
        file_name = issue.get("file")
        line = issue.get("line")

        if not file_name or not line:
            continue

        matching_file = next(
            (file for file in files if file.get("file") == file_name),
            None,
        )

        if not matching_file:
            continue

        patch = matching_file.get("patch", "")
        changed_lines = get_patch_line_numbers(patch)

        if line not in changed_lines:
            print(
                f"Skipping inline comment for "
                f"{file_name}:{line} because the line "
                f"is not part of the PR diff."
            )
            continue

        issue_key = (
            file_name,
            line,
            issue.get("title", ""),
        )

        if issue_key in seen:
            print(f"Skipping duplicate inline comment for " f"{file_name}:{line}")
            continue

        seen.add(issue_key)

        severity = issue.get(
            "severity",
            "INFO",
        ).upper()

        title = issue.get(
            "title",
            "Code Issue",
        )

        description = issue.get(
            "description",
            "",
        )

        suggestion = issue.get(
            "suggestion",
            "",
        )

        body = (
            f"**{severity} — {title}**\n\n"
            f"{description}\n\n"
            f"**Suggestion:** {suggestion}"
        )

        comments.append(
            {
                "path": file_name,
                "line": line,
                "side": "RIGHT",
                "body": body,
            }
        )

    if not comments:
        print("No valid inline comments found.")
        return {
            "created": False,
            "commit_id": commit_id,
            "comments": [],
        }

    print(f"Prepared {len(comments)} inline comments " f"for GitHub review.")

    return {
        "created": True,
        "commit_id": commit_id,
        "comments": comments,
    }


def create_pull_request_review(
    owner: str,
    repo: str,
    pull_number: int,
    body: str,
    commit_id: str,
    comments: list,
    event: str = "COMMENT",
):
    url = f"{GITHUB_API_URL}/repos/" f"{owner}/{repo}/pulls/{pull_number}/reviews"

    response = httpx.post(
        url,
        headers=github_headers(),
        json={
            "body": body,
            "commit_id": commit_id,
            "event": event,
            "comments": comments,
        },
        timeout=10,
    )

    response.raise_for_status()
    return response.json()
