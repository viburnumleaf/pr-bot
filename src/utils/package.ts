import { Octokit } from '@octokit/rest';
import { findPackageJsonFiles } from './workspace';
import { updateMultiplePackageJson, updatePackageJsonContent } from '../package/update';
import { getGitHubToken } from '../git/auth';
import type { MultiPackageUpdateResult } from '../types/package';
import type { CliOptions } from '../schemas/cli';
import type { PackageFileUpdate } from '../package/update';

// Gets file content from GitHub
const getFileFromGitHub = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string> => {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path ${path} is not a file`);
    }

    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error(`File ${path} not found in repository`);
    }
    throw error;
  }
};

export const updateDependency = async (
  repoFullName: string,
  branchName: string,
  packageName: string,
  version: string,
  options: CliOptions
): Promise<{ result: MultiPackageUpdateResult; fileUpdates: PackageFileUpdate[] }> => {
  const [owner, repo] = repoFullName.split('/');
  const token = getGitHubToken();
  const octokit = new Octokit({ auth: token });

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
    throw new Error('❌ No package.json files found in the repository');
  }

  console.log(`\n🔍 Found ${packageJsonLocations.length} package.json file(s):`);
  packageJsonLocations.forEach(loc => {
    console.log(`   - ${loc.relativePath}`);
  });

  // Get file contents from GitHub
  const packageJsonFiles = await Promise.all(
    packageJsonLocations.map(async (loc) => ({
      path: loc.relativePath,
      content: await getFileFromGitHub(octokit, owner, repo, loc.relativePath, branchName)
    }))
  );

  // Update all package.json files
  const result = updateMultiplePackageJson(packageJsonFiles, packageName, version);

  console.log(`\n✅ Updated ${packageName} to ${version} in ${result.totalUpdated} file(s):`);
  result.results.forEach(r => {
    console.log(`   - ${r.packageJsonPath} (${r.updatedIn})`);
  });

  console.log(`\n📝 File diff(s):\n`);
  result.results.forEach(r => {
    console.log(r.diff);
    console.log('');
  });

  // Prepare file updates for PR
  const fileUpdates: PackageFileUpdate[] = result.results.map(r => {
    const file = packageJsonFiles.find(f => f.path === r.packageJsonPath);
    if (!file) {
      throw new Error(`File ${r.packageJsonPath} not found`);
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
      diff: r.diff
    };
  });

  return { result, fileUpdates };
};
