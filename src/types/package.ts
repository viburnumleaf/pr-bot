// Package update related types
export type DependencySection = 'dependencies' | 'devDependencies';

export type PackageUpdateResult = {
  updated: boolean;
  diff: string;
  packageJsonPath: string;
  updatedIn: DependencySection;
}

export type MultiPackageUpdateResult = {
  updated: boolean;
  results: PackageUpdateResult[];
  totalUpdated: number;
}
