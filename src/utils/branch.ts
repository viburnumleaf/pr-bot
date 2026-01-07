import { BRANCH_PATTERNS } from '../constants';

// Generates a standardized branch name for dependency updates
// Replaces forward slashes in package names with hyphens for valid branch names
// TODO: Add validation for branch name length (GitHub limit is 255 chars)
export const generateBranchName = (packageName: string, version: string): string => {
  const sanitizedPackage = packageName.replace(/\//g, '-');
  return `${BRANCH_PATTERNS.PREFIX}${sanitizedPackage}-${version}`;
};
