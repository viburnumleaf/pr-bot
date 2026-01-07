import { Octokit } from '@octokit/rest';
import { WorkspaceType, type WorkspaceConfig, type PackageJsonLocation } from '../types/workspace';

// Helper: Check if file exists via GitHub API
const fileExists = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<boolean> => {
  try {
    await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
    return true;
  } catch {
    return false;
  }
};

// Helper: Read and parse package.json from GitHub
const readPackageJson = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
) => {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: 'package.json',
    ref: branch
  });

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error('package.json is not a file');
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content) as {
    workspaces?: string[] | { packages?: string[] };
  };
};

// Helper: Check for pnpm workspace
const checkPnpmWorkspace = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await fileExists(octokit, owner, repo, 'pnpm-workspace.yaml', branch);
};

// Helper: Check for yarn workspace
const checkYarnWorkspace = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await fileExists(octokit, owner, repo, 'yarn.lock', branch);
};

// Helper: Check for npm workspace
const checkNpmWorkspace = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  return await fileExists(octokit, owner, repo, 'package-lock.json', branch);
};

// Helper: Check if package.json has workspaces field
const hasWorkspacesField = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> => {
  try {
    const packageJson = await readPackageJson(octokit, owner, repo, branch);
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
  if (await checkPnpmWorkspace(octokit, owner, repo, branch)) {
    return WorkspaceType.PNPM;
  }

  if (!(await hasWorkspacesField(octokit, owner, repo, branch))) {
    return WorkspaceType.NONE;
  }

  if (await checkYarnWorkspace(octokit, owner, repo, branch)) {
    return WorkspaceType.YARN;
  }

  if (await checkNpmWorkspace(octokit, owner, repo, branch)) {
    return WorkspaceType.NPM;
  }

  return WorkspaceType.NPM;
};

// Helper: Parse pnpm workspace from YAML
const parsePnpmWorkspace = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> => {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: 'pnpm-workspace.yaml',
    ref: branch
  });

  if (Array.isArray(data) || data.type !== 'file') {
    return ['packages/*'];
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8');
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

  return workspaces.length > 0 ? workspaces : ['packages/*'];
};

// Helper: Parse yarn/npm workspace from package.json
const parseYarnNpmWorkspace = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> => {
  const packageJson = await readPackageJson(octokit, owner, repo, branch);

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
  const type = await detectWorkspaceType(octokit, owner, repo, branch);

  if (type === WorkspaceType.PNPM) {
    const workspaces = await parsePnpmWorkspace(octokit, owner, repo, branch);
    return { type, workspaces };
  }

  if (type === WorkspaceType.YARN || type === WorkspaceType.NPM) {
    const workspaces = await parseYarnNpmWorkspace(octokit, owner, repo, branch);
    return { type, workspaces };
  }

  return { type, workspaces: [] };
};

// Helper: Expand glob pattern by listing directories from GitHub
const expandWorkspacePattern = async (
  octokit: Octokit,
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
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: dirPath || '.',
          ref: branch
        });

        if (!Array.isArray(data)) {
          return;
        }

        for (const item of data) {
          if (item.type === 'dir') {
            const itemPath = dirPath ? `${dirPath}/${item.name}` : item.name;
            const packageJsonPath = `${itemPath}/package.json`;

            if (await fileExists(octokit, owner, repo, packageJsonPath, branch)) {
              results.push(itemPath);
            }

            await searchRecursive(itemPath);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    await searchRecursive(basePattern || '.');
    return results;
  }

  // Handle simple * patterns
  const basePattern = pattern.replace(/\/\*$/, '');
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: basePattern,
      ref: branch
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
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
  const locations: PackageJsonLocation[] = [];

  // If specific path is provided, use only that
  if (specificPath) {
    const normalizedPath = specificPath.endsWith('package.json')
      ? specificPath
      : `${specificPath}/package.json`;

    if (!(await fileExists(octokit, owner, repo, normalizedPath, branch))) {
      throw new Error(`package.json not found at ${normalizedPath}`);
    }

    return [{
      path: normalizedPath,
      relativePath: normalizedPath
    }];
  }

  // Check root package.json
  if (await fileExists(octokit, owner, repo, 'package.json', branch)) {
    locations.push({
      path: 'package.json',
      relativePath: 'package.json'
    });
  }

  // Find workspaces
  const workspaceConfig = await getWorkspaceConfig(octokit, owner, repo, branch);

  if (workspaceConfig.type !== WorkspaceType.NONE && workspaceConfig.workspaces.length > 0) {
    for (const workspacePattern of workspaceConfig.workspaces) {
      const expanded = await expandWorkspacePattern(octokit, owner, repo, workspacePattern, branch);

      for (const workspacePath of expanded) {
        const packageJsonPath = `${workspacePath}/package.json`;

        if (!(await fileExists(octokit, owner, repo, packageJsonPath, branch))) {
          continue;
        }

        const alreadyExists = locations.some(loc => loc.path === packageJsonPath);
        if (alreadyExists) {
          continue;
        }

        locations.push({
          path: packageJsonPath,
          relativePath: packageJsonPath
        });
      }
    }
  }

  return locations;
};
