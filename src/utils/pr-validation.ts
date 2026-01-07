import { Octokit } from '@octokit/rest';

// Check if PR already exists for the same package and version
export const checkExistingPR = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  packageName: string,
  version: string,
  baseBranch: string
): Promise<{ exists: boolean; prNumber?: number; prUrl?: string }> => {
  try {
    // Get all open PRs targeting the base branch
    const { data: prs } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      base: baseBranch,
      per_page: 100
    });

    // Escape special regex characters
    const escapedPackage = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern for PR title: "Bump <package> to <version>"
    const titlePattern = new RegExp(`bump\\s+${escapedPackage}\\s+to\\s+${escapedVersion}`, 'i');

    for (const pr of prs) {
      // Check if PR title matches our pattern
      if (titlePattern.test(pr.title)) {
        return {
          exists: true,
          prNumber: pr.number,
          prUrl: pr.html_url
        };
      }

      // Also check PR body and files for the package and version
      if (pr.body?.includes(packageName) && pr.body.includes(version)) {
        // Verify by checking if package.json files were changed
        const { data: files } = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: pr.number
        });

        const hasPackageJson = files.some(file => 
          file.filename.endsWith('package.json') && 
          (file.status === 'modified' || file.status === 'added')
        );

        if (hasPackageJson) {
          return {
            exists: true,
            prNumber: pr.number,
            prUrl: pr.html_url
          };
        }
      }
    }

    return { exists: false };
  } catch (error) {
    // If check fails, continue (might be rate limited or other issues)
    console.warn('⚠️  Could not check for existing PRs:', error instanceof Error ? error.message : String(error));
    return { exists: false };
  }
};

// Generate standardized commit message
export const generateCommitMessage = (packageName: string, version: string): string => {
  return `chore(deps): bump ${packageName} to ${version}`;
};

// Generate standardized PR title
export const generatePRTitle = (packageName: string, version: string): string => {
  return `Bump ${packageName} to ${version}`;
};
