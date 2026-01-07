import fs from 'fs/promises';
import path from 'path';
import { WorkspaceType, type WorkspaceConfig, type PackageJsonLocation } from '../types/workspace';

// Helper: Check if file exists
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Helper: Read and parse package.json
const readPackageJson = async (repoPath: string) => {
  const packageJsonPath = path.join(repoPath, 'package.json');
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  return JSON.parse(content) as {
    workspaces?: string[] | { packages?: string[] };
  };
};

// Helper: Check for pnpm workspace
const checkPnpmWorkspace = async (repoPath: string): Promise<boolean> => {
  const pnpmWorkspacePath = path.join(repoPath, 'pnpm-workspace.yaml');
  return await fileExists(pnpmWorkspacePath);
};

// Helper: Check for yarn workspace
const checkYarnWorkspace = async (repoPath: string): Promise<boolean> => {
  const yarnLockPath = path.join(repoPath, 'yarn.lock');
  return await fileExists(yarnLockPath);
};

// Helper: Check for npm workspace
const checkNpmWorkspace = async (repoPath: string): Promise<boolean> => {
  const packageLockPath = path.join(repoPath, 'package-lock.json');
  return await fileExists(packageLockPath);
};

// Helper: Check if package.json has workspaces field
const hasWorkspacesField = async (repoPath: string): Promise<boolean> => {
  try {
    const packageJson = await readPackageJson(repoPath);
    return !!packageJson.workspaces;
  } catch {
    return false;
  }
};

// Detects workspace type by checking for workspace configuration files
export const detectWorkspaceType = async (repoPath: string): Promise<WorkspaceType> => {
  if (await checkPnpmWorkspace(repoPath)) {
    return WorkspaceType.PNPM;
  }

  if (!(await hasWorkspacesField(repoPath))) {
    return WorkspaceType.NONE;
  }

  if (await checkYarnWorkspace(repoPath)) {
    return WorkspaceType.YARN;
  }

  if (await checkNpmWorkspace(repoPath)) {
    return WorkspaceType.NPM;
  }

  // Default to npm if workspaces are defined but no lock file found
  return WorkspaceType.NPM;
};

// Helper: Parse pnpm workspace from YAML
const parsePnpmWorkspace = async (repoPath: string): Promise<string[]> => {
  const pnpmWorkspacePath = path.join(repoPath, 'pnpm-workspace.yaml');
  const content = await fs.readFile(pnpmWorkspacePath, 'utf-8');
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
const parseYarnNpmWorkspace = async (repoPath: string): Promise<string[]> => {
  const packageJson = await readPackageJson(repoPath);

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
export const getWorkspaceConfig = async (repoPath: string): Promise<WorkspaceConfig> => {
  const type = await detectWorkspaceType(repoPath);

  if (type === WorkspaceType.PNPM) {
    const workspaces = await parsePnpmWorkspace(repoPath);
    return { type, workspaces };
  }

  if (type === WorkspaceType.YARN || type === WorkspaceType.NPM) {
    const workspaces = await parseYarnNpmWorkspace(repoPath);
    return { type, workspaces };
  }

  return { type, workspaces: [] };
};

// Helper: Expand recursive glob pattern (**)
const expandRecursivePattern = async (
  repoPath: string,
  pattern: string
): Promise<string[]> => {
  const basePattern = pattern.split('**')[0].replace(/\/$/, '');
  const fullBasePath = path.join(repoPath, basePattern || '.');
  const results: string[] = [];

  const searchRecursive = async (dir: string, relativeDir: string): Promise<void> => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const entryPath = path.join(dir, entry.name);
        const relativePath = path.join(relativeDir, entry.name);
        const packageJsonPath = path.join(entryPath, 'package.json');

        if (await fileExists(packageJsonPath)) {
          results.push(path.join(basePattern || '.', relativePath));
        }

        await searchRecursive(entryPath, relativePath);
      }
    } catch {
      // Ignore errors
    }
  };

  await searchRecursive(fullBasePath, '');
  return results;
};

// Helper: Expand simple glob pattern (*)
const expandSimplePattern = async (repoPath: string, pattern: string): Promise<string[]> => {
  const basePattern = pattern.replace(/\/\*$/, '');
  const fullPath = path.join(repoPath, basePattern);

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(basePattern, entry.name));
  } catch {
    return [];
  }
};

// Expands workspace glob patterns to actual paths
const expandWorkspacePattern = async (
  repoPath: string,
  pattern: string
): Promise<string[]> => {
  if (!pattern.includes('*')) {
    return [pattern];
  }

  if (pattern.includes('**')) {
    return await expandRecursivePattern(repoPath, pattern);
  }

  return await expandSimplePattern(repoPath, pattern);
};

// Helper: Handle specific path provided by user
const handleSpecificPath = async (
  repoPath: string,
  specificPath: string
): Promise<PackageJsonLocation[]> => {
  const normalizedPath = path.isAbsolute(specificPath)
    ? specificPath
    : path.join(repoPath, specificPath);

  const stat = await fs.stat(normalizedPath);

  if (stat.isDirectory()) {
    const packageJsonPath = path.join(normalizedPath, 'package.json');
    if (!(await fileExists(packageJsonPath))) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }
    return [{
      path: packageJsonPath,
      relativePath: path.relative(repoPath, packageJsonPath)
    }];
  }

  if (normalizedPath.endsWith('package.json')) {
    if (!(await fileExists(normalizedPath))) {
      throw new Error(`package.json not found at ${normalizedPath}`);
    }
    return [{
      path: normalizedPath,
      relativePath: path.relative(repoPath, normalizedPath)
    }];
  }

  throw new Error(`Invalid path: ${normalizedPath}. Must be a directory or package.json file`);
};

// Helper: Add root package.json if exists
const addRootPackageJson = async (
  repoPath: string,
  locations: PackageJsonLocation[]
): Promise<void> => {
  const rootPackageJson = path.join(repoPath, 'package.json');
  if (await fileExists(rootPackageJson)) {
    locations.push({
      path: rootPackageJson,
      relativePath: 'package.json'
    });
  }
};

// Helper: Add workspace package.json files
const addWorkspacePackageJson = async (
  repoPath: string,
  locations: PackageJsonLocation[],
  workspaceConfig: WorkspaceConfig
): Promise<void> => {
  if (workspaceConfig.type === WorkspaceType.NONE || workspaceConfig.workspaces.length === 0) {
    return;
  }

  for (const workspacePattern of workspaceConfig.workspaces) {
    const expanded = await expandWorkspacePattern(repoPath, workspacePattern);

    for (const workspacePath of expanded) {
      const fullWorkspacePath = path.join(repoPath, workspacePath);
      const packageJsonPath = path.join(fullWorkspacePath, 'package.json');

      if (!(await fileExists(packageJsonPath))) {
        continue;
      }

      const alreadyExists = locations.some(loc => loc.path === packageJsonPath);
      if (alreadyExists) {
        continue;
      }

      locations.push({
        path: packageJsonPath,
        relativePath: path.relative(repoPath, packageJsonPath)
      });
    }
  }
};

// Finds all package.json files in the repository
export const findPackageJsonFiles = async (
  repoPath: string,
  specificPath?: string
): Promise<PackageJsonLocation[]> => {
  if (specificPath) {
    return await handleSpecificPath(repoPath, specificPath);
  }

  const locations: PackageJsonLocation[] = [];
  await addRootPackageJson(repoPath, locations);

  const workspaceConfig = await getWorkspaceConfig(repoPath);
  await addWorkspacePackageJson(repoPath, locations, workspaceConfig);

  return locations;
};
