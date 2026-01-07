// Application constants

export const GITHUB_API = {
  PER_PAGE_MAX: 100,
  DEFAULT_PER_PAGE: 30,
} as const;

export const FILE_PATTERNS = {
  PACKAGE_JSON: 'package.json',
  PNPM_WORKSPACE: 'pnpm-workspace.yaml',
  YARN_LOCK: 'yarn.lock',
  NPM_LOCK: 'package-lock.json',
} as const;

export const WORKSPACE_PATTERNS = {
  DEFAULT_PNPM: 'packages/*',
} as const;

export const PR_PATTERNS = {
  TITLE_PREFIX: 'Bump',
  COMMIT_PREFIX: 'chore(deps):',
} as const;

export const BRANCH_PATTERNS = {
  PREFIX: 'chore/bump-',
} as const;

export const DIFF_CONTEXT = {
  LINES_BEFORE: 2,
  LINES_AFTER: 2,
} as const;
