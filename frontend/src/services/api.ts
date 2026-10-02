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
};

export async function reviewCode(
  fileName: string,
  code: string,
): Promise<ReviewResult> {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    throw new Error("Please login to review code.");
  }

  const user = JSON.parse(storedUser) as AuthUser;

  const response = await fetch(`${API_URL}/ai-review/?user_id=${user.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${API_URL}/reviews/`);

  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }

  return response.json();
}

export async function getReview(id: number): Promise<ReviewDetails> {
  const response = await fetch(`${API_URL}/reviews/${id}`);

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
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    throw new Error("Please login to review pull requests.");
  }

  const user = JSON.parse(storedUser) as AuthUser;

  const url =
    `${API_URL}/github/pr/${owner}/${repo}/${pullNumber}/full-review` +
    `?user_id=${user.id}`;

  console.log("Starting PR review:", url);

  const response = await fetch(url);
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

export async function getGitHubRepositories(): Promise<GitHubRepository[]> {
  const response = await fetch(`${API_URL}/auth/github/repositories`);

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub repositories");
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
  );

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub pull requests");
  }

  const data = await response.json();

  return data.pull_requests;
}

export async function getUserReviews(
  userId: number,
): Promise<ReviewHistoryItem[]> {
  const response = await fetch(`${API_URL}/reviews/user/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user reviews");
  }

  return response.json();
}

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
  return data;
}

export async function getUser(userId: number): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/me?user_id=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}
