/**
 * GitHub PR related types
 */
export interface PullRequestResult {
  prUrl: string;
  prNumber: number;
}

export interface RepositoryInfo {
  owner: string;
  repo: string;
}
