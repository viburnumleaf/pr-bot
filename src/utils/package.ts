import { Octokit } from '@octokit/rest';
import { findPackageJsonFiles } from './workspace';
import { updateMultiplePackageJson, updatePackageJsonContent } from '../package/update';
import { getGitHubToken } from '../git/auth';
import { GitHubClient } from '../services/github-client';
import { logger } from '../services/logger';
import { PackageError, RepositoryError } from '../errors';
import type { MultiPackageUpdateResult } from '../types/package';
import type { CliOptions } from '../schemas/cli';
import type { PackageFileUpdate } from '../package/update';

// Parses repository full name into owner and repo
const parseRepository = (repoFullName: string): { owner: string; repo: string } => {
  const parts = repoFullName.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new RepositoryError(
      `Invalid repository format: ${repoFullName}. Expected format: owner/repo`
    );
  }
  return { owner: parts[0], repo: parts[1] };
};

// Creates a GitHub client instance
const createGitHubClient = (): GitHubClient => {
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });
  return new GitHubClient(octokit);
};

// Updates dependency version across all package.json files in the repository
export const updateDependency = async (
  repoFullName: string,
  branchName: string,
  packageName: string,
  version: string,
  options: CliOptions
): Promise<{ result: MultiPackageUpdateResult; fileUpdates: PackageFileUpdate[] }> => {
  const { owner, repo } = parseRepository(repoFullName);
  const client = createGitHubClient();
  const octokit = new Octokit({ auth: getGitHubToken() });

  // Find all package.json files
  const packageJsonLocations = await findPackageJsonFiles(
    repoFullName,
    options.path,
    octokit,
    owner,
    repo,
    branchName
  );

  if (packageJsonLocations.length === 0) {
    throw new PackageError('No package.json files found in the repository');
  }

  logger.info(`Found ${packageJsonLocations.length} package.json file(s):`);
  packageJsonLocations.forEach(loc => {
    logger.info(`  - ${loc.relativePath}`);
  });

  // Get file contents from GitHub
  const packageJsonFiles = await Promise.all(
    packageJsonLocations.map(async (loc) => {
      const { content } = await client.getFileContent(
        owner,
        repo,
        loc.relativePath,
        branchName
      );
      return {
        path: loc.relativePath,
        content,
      };
    })
  );

  // Update all package.json files
  const result = updateMultiplePackageJson(packageJsonFiles, packageName, version);

  logger.info(
    `Updated ${packageName} to ${version} in ${result.totalUpdated} file(s):`
  );
  result.results.forEach(r => {
    logger.info(`  - ${r.packageJsonPath} (${r.updatedIn})`);
  });

  logger.info('File diff(s):');
  result.results.forEach(r => {
    logger.info(r.diff);
  });

  // Prepare file updates for PR
  const fileUpdates: PackageFileUpdate[] = result.results.map(r => {
    const file = packageJsonFiles.find(f => f.path === r.packageJsonPath);
    if (!file) {
      throw new PackageError(`File ${r.packageJsonPath} not found`);
    }
    const { newContent } = updatePackageJsonContent(
      file.content,
      packageName,
      version
    );
    return {
      path: r.packageJsonPath,
      content: newContent,
      updatedIn: r.updatedIn,
      diff: r.diff,
    };
  });

  return { result, fileUpdates };
};
