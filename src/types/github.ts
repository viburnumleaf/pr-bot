// GitHub PR related types
export type PullRequestResult = {
  readonly prUrl: string;
  readonly prNumber: number;
}

export type RepositoryInfo = {
  readonly owner: string;
  readonly repo: string;
}
