import { Octokit } from '@octokit/rest';
import { GitHubClient } from '../services/github-client';
import { WorkspaceType, type WorkspaceConfig, type PackageJsonLocation } from '../types/workspace';
import { FILE_PATTERNS, WORKSPACE_PATTERNS } from '../constants';
import { logger } from '../services/logger';

// Creates a GitHub client instance
const createGitHubClient = (octokit: Octokit): GitHubClient => {
  return new GitHubClient(octokit);
};

// Reads and parses package.json from GitHub
const readPackageJson = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
) => {
  const { content } = await client.getFileContent(
    owner,
    repo,
    FILE_PATTERNS.PACKAGE_JSON,
    branch
  );

  return JSON.parse(content) as {
    workspaces?: string[] | { packages?: string[] };
  };
};

// Checks for pnpm workspace configuration
const checkPnpmWorkspace = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await client.fileExists(
    owner,
    repo,
    FILE_PATTERNS.PNPM_WORKSPACE,
    branch
  );
};

// Checks for yarn workspace configuration
const checkYarnWorkspace = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await client.fileExists(
    owner,
    repo,
    FILE_PATTERNS.YARN_LOCK,
    branch
  );
};

// Checks for npm workspace configuration
const checkNpmWorkspace = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await client.fileExists(
    owner,
    repo,
    FILE_PATTERNS.NPM_LOCK,
    branch
  );
};

// Checks if package.json has workspaces field
const hasWorkspacesField = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  try {
    const packageJson = await readPackageJson(client, owner, repo, branch);
    return !!packageJson.workspaces;
  } catch {
    return false;
  }
};

// Detects workspace type by checking for workspace configuration files
export const detectWorkspaceType = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<WorkspaceType> => {
  const client = createGitHubClient(octokit);

  if (await checkPnpmWorkspace(client, owner, repo, branch)) {
    return WorkspaceType.PNPM;
  }

  if (!(await hasWorkspacesField(client, owner, repo, branch))) {
    return WorkspaceType.NONE;
  }

  if (await checkYarnWorkspace(client, owner, repo, branch)) {
    return WorkspaceType.YARN;
  }

  if (await checkNpmWorkspace(client, owner, repo, branch)) {
    return WorkspaceType.NPM;
  }

  return WorkspaceType.NPM;
};

// Parses pnpm workspace configuration from YAML
const parsePnpmWorkspace = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> => {
  try {
    const { content } = await client.getFileContent(
      owner,
      repo,
      FILE_PATTERNS.PNPM_WORKSPACE,
      branch
    );

    const workspaces: string[] = [];
    const lines = content.split('\n');
    let inPackagesSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      if (trimmed.startsWith('packages:')) {
        inPackagesSection = true;
        continue;
      }

      if (!inPackagesSection) {
        continue;
      }

      if (trimmed.includes(':')) {
        break;
      }

      if (trimmed.startsWith('-')) {
        const workspace = trimmed.slice(1).trim().replace(/['"]/g, '');
        if (workspace) {
          workspaces.push(workspace);
        }
        continue;
      }

      const workspace = trimmed.replace(/['"]/g, '');
      if (workspace) {
        workspaces.push(workspace);
      }
    }

    return workspaces.length > 0 ? workspaces : [WORKSPACE_PATTERNS.DEFAULT_PNPM];
  } catch {
    return [WORKSPACE_PATTERNS.DEFAULT_PNPM];
  }
};

// Parses yarn/npm workspace configuration from package.json
const parseYarnNpmWorkspace = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> => {
  const packageJson = await readPackageJson(client, owner, repo, branch);

  if (!packageJson.workspaces) {
    return [];
  }

  if (Array.isArray(packageJson.workspaces)) {
    return packageJson.workspaces;
  }

  if (packageJson.workspaces.packages) {
    return packageJson.workspaces.packages;
  }

  return [];
};

// Gets workspace configuration
export const getWorkspaceConfig = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<WorkspaceConfig> => {
  const client = createGitHubClient(octokit);
  const type = await detectWorkspaceType(octokit, owner, repo, branch);

  if (type === WorkspaceType.PNPM) {
    const workspaces = await parsePnpmWorkspace(client, owner, repo, branch);
    return { type, workspaces };
  }

  if (type === WorkspaceType.YARN || type === WorkspaceType.NPM) {
    const workspaces = await parseYarnNpmWorkspace(client, owner, repo, branch);
    return { type, workspaces };
  }

  return { type, workspaces: [] };
};

// Expands glob pattern by listing directories from GitHub
// TODO: Optimize recursive search for large repositories (consider using GitHub search API)
const expandWorkspacePattern = async (
  client: GitHubClient,
  owner: string,
  repo: string,
  pattern: string,
  branch: string
): Promise<string[]> => {
  if (!pattern.includes('*')) {
    return [pattern];
  }

  if (pattern.includes('**')) {
    // For recursive patterns, we'll search recursively
    const basePattern = pattern.split('**')[0].replace(/\/$/, '');
    const results: string[] = [];

    const searchRecursive = async (dirPath: string): Promise<void> => {
      try {
        const items = await client.getDirectoryContent(
          owner,
          repo,
          dirPath || '.',
          branch
        );

        for (const item of items) {
          if (item.type === 'dir') {
            const itemPath = dirPath ? `${dirPath}/${item.name}` : item.name;
            const packageJsonPath = `${itemPath}/${FILE_PATTERNS.PACKAGE_JSON}`;

            if (await client.fileExists(owner, repo, packageJsonPath, branch)) {
              results.push(itemPath);
            }

            await searchRecursive(itemPath);
          }
        }
      } catch {
        // Ignore errors for missing directories
      }
    };

    await searchRecursive(basePattern || '.');
    return results;
  }

  // Handle simple * patterns
  const basePattern = pattern.replace(/\/\*$/, '');
  
  try {
    const items = await client.getDirectoryContent(
      owner,
      repo,
      basePattern,
      branch
    );

    return items
      .filter(item => item.type === 'dir')
      .map(item => `${basePattern}/${item.name}`);
  } catch {
    return [];
  }
};

// Finds all package.json files in the repository via GitHub API
export const findPackageJsonFiles = async (
  repoFullName: string,
  specificPath: string | undefined,
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<PackageJsonLocation[]> => {
  const client = createGitHubClient(octokit);
  const locations: PackageJsonLocation[] = [];

  // If specific path is provided, use only that
  if (specificPath) {
    const normalizedPath = specificPath.endsWith(FILE_PATTERNS.PACKAGE_JSON)
      ? specificPath
      : `${specificPath}/${FILE_PATTERNS.PACKAGE_JSON}`;

    if (!(await client.fileExists(owner, repo, normalizedPath, branch))) {
      throw new Error(`package.json not found at ${normalizedPath}`);
    }

    return [{
      path: normalizedPath,
      relativePath: normalizedPath,
    }];
  }

  // Check root package.json
  if (await client.fileExists(owner, repo, FILE_PATTERNS.PACKAGE_JSON, branch)) {
    locations.push({
      path: FILE_PATTERNS.PACKAGE_JSON,
      relativePath: FILE_PATTERNS.PACKAGE_JSON,
    });
  }

  // Find workspaces
  const workspaceConfig = await getWorkspaceConfig(octokit, owner, repo, branch);

  if (workspaceConfig.type !== WorkspaceType.NONE && workspaceConfig.workspaces.length > 0) {
    for (const workspacePattern of workspaceConfig.workspaces) {
      const expanded = await expandWorkspacePattern(
        client,
        owner,
        repo,
        workspacePattern,
        branch
      );

      for (const workspacePath of expanded) {
        const packageJsonPath = `${workspacePath}/${FILE_PATTERNS.PACKAGE_JSON}`;

        if (!(await client.fileExists(owner, repo, packageJsonPath, branch))) {
          continue;
        }

        const alreadyExists = locations.some(loc => loc.path === packageJsonPath);
        if (alreadyExists) {
          continue;
        }

        locations.push({
          path: packageJsonPath,
          relativePath: packageJsonPath,
        });
      }
    }
  }

  return locations;
};
