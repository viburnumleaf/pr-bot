// Package update related types
export type DependencySection = 'dependencies' | 'devDependencies';

export type PackageUpdateResult = {
  readonly updated: boolean;
  readonly diff: string;
  readonly packageJsonPath: string;
  readonly updatedIn: DependencySection;
}

export type MultiPackageUpdateResult = {
  readonly updated: boolean;
  readonly results: readonly PackageUpdateResult[];
  readonly totalUpdated: number;
}
