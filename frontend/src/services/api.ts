import type {
  ReviewHistoryItem,
  ReviewResult,
  ReviewDetails,
} from "../types/review";

const API_URL = import.meta.env.VITE_API_URL;

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
};

export type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  user: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  draft: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  github_login?: string | null;
  created_at: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
  access_token: string;
  token_type: string;
};

/* ---------- Auth helpers ---------- */

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ---------- Reviews ---------- */

export async function reviewCode(
  fileName: string,
  code: string,
): Promise<ReviewResult> {
  const response = await fetch(`${API_URL}/ai-review/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      file_name: fileName,
      code,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail?.[0]?.msg || data?.detail || "Failed to review code",
    );
  }

  return response.json();
}

export async function getReviews(): Promise<ReviewHistoryItem[]> {
  const response = await fetch(`${API_URL}/reviews/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }

  return response.json();
}

export async function getReview(id: number): Promise<ReviewDetails> {
  const response = await fetch(`${API_URL}/reviews/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch review");
  }

  return response.json();
}

export async function reviewPullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const url = `${API_URL}/github/pr/${owner}/${repo}/${pullNumber}/full-review`;

  console.log("Starting PR review:", url);

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  console.log("PR review response:", response.status, response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PR review error:", errorText);
    throw new Error("Failed to review pull request");
  }

  const text = await response.text();
  console.log("PR review response received:", text.length);
  const data = JSON.parse(text);
  console.log("PR review data:", data);
  return data;
}

/* ---------- GitHub ---------- */

export async function getGitHubRepositories(): Promise<GitHubRepository[]> {
  const response = await fetch(`${API_URL}/auth/github/repositories`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(data?.detail || "Failed to fetch GitHub repositories");
  }

  const data = await response.json();

  return data.repositories;
}

export async function getGitHubPullRequests(
  owner: string,
  repo: string,
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `${API_URL}/auth/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(data?.detail || "Failed to fetch GitHub pull requests");
  }

  const data = await response.json();

  return data.pull_requests;
}

export async function getUserReviews(
  userId: number,
): Promise<ReviewHistoryItem[]> {
  const response = await fetch(`${API_URL}/reviews/user/${userId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user reviews");
  }

  return response.json();
}

/* ---------- Auth ---------- */
export async function loginUser(
  loginData: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Login failed");
  }

  const data: LoginResponse = await response.json();

  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("access_token", data.access_token);

  return data;
}

export async function getUser(): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

export async function getGitHubConnectUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/github/connect-url`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to start GitHub connection");
  }
  const data = await response.json();
  return data.url;
}

export async function disconnectGitHub(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/github/disconnect`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to disconnect GitHub");
  }
}
