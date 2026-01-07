import { GitHubClient } from '../services/github-client';
import { logger } from '../services/logger';
import { FILE_PATTERNS, PR_PATTERNS } from '../constants';

export type ExistingPRResult = {
  exists: boolean;
  prNumber?: number;
  prUrl?: string;
}

// Escapes special regex characters in a string
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Checks if PR already exists for the same package and version
// TODO: Improve PR matching algorithm to handle version ranges and different PR title formats
export const checkExistingPR = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  packageName: string,
  version: string,
  baseBranch: string
): Promise<ExistingPRResult> => {
  try {
    const prs = await client.listPullRequests(owner, repo, {
      state: 'open',
      base: baseBranch,
      perPage: 100,
    });

    // Escape special regex characters
    const escapedPackage = escapeRegex(packageName);
    const escapedVersion = escapeRegex(version);
    
    // Pattern for PR title: "Bump <package> to <version>"
    const titlePattern = new RegExp(
      `${PR_PATTERNS.TITLE_PREFIX.toLowerCase()}\\s+${escapedPackage}\\s+to\\s+${escapedVersion}`,
      'i'
    );

    for (const pr of prs) {
      // Check if PR title matches our pattern
      if (titlePattern.test(pr.title)) {
        return {
          exists: true,
          prNumber: pr.number,
          prUrl: pr.html_url,
        };
      }

      // Also check PR body and files for the package and version
      if (pr.body?.includes(packageName) && pr.body.includes(version)) {
        // Verify by checking if package.json files were changed
        const files = await client.listPullRequestFiles(owner, repo, pr.number);

        const hasPackageJson = files.some(
          file =>
            file.filename.endsWith(FILE_PATTERNS.PACKAGE_JSON) &&
            (file.status === 'modified' || file.status === 'added')
        );

        if (hasPackageJson) {
          return {
            exists: true,
            prNumber: pr.number,
            prUrl: pr.html_url,
          };
        }
      }
    }

    return { exists: false };
  } catch (error) {
    // If check fails, continue (might be rate limited or other issues)
    logger.warn('Could not check for existing PRs', error);
    return { exists: false };
  }
};

// Generates standardized commit message following conventional commits
export const generateCommitMessage = (packageName: string, version: string): string => {
  return `${PR_PATTERNS.COMMIT_PREFIX} bump ${packageName} to ${version}`;
};

// Generates standardized PR title
export const generatePRTitle = (packageName: string, version: string): string => {
  return `${PR_PATTERNS.TITLE_PREFIX} ${packageName} to ${version}`;
};
