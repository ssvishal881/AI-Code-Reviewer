export type Issue = {
  category: string;
  severity: string;
  title: string;
  file: string;
  line: number;
  description: string;
  suggestion: string;
  source: string;
  code_snippet?: string;
};

export type ReviewResult = {
  score: number;
  summary: string;
  issues: Issue[];
};

export type ReviewHistoryItem = {
  id: number;
  score: number;
  summary: string;
  status: string;
  issues: Issue[];
  repo_owner?: string | null;
  repo_name?: string | null;
  pull_number?: number | null;
  commit_sha?: string | null;
  created_at?: string;
};

export type ReviewDetails = {
  id: number;
  score: number;
  summary: string;
  status: string;
  issues: Issue[];
  repo_owner?: string | null;
  repo_name?: string | null;
  pull_number?: number | null;
  commit_sha?: string | null;
  created_at?: string;
};

export type GitHubFileReview = {
  file: string;
  status: string;
  additions: number;
  deletions: number;
  score: number;
  summary: string;
  issues: Issue[];
};

export type GitHubReviewResponse = {
  review: {
    score: number;
    issues: Issue[];
    files: GitHubFileReview[];
  };
  review_id: number;
  comment_id?: number;
  github_review_id?: number;
  github_review_state?: string;
  inline_comments?: number;
};
