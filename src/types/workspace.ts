// Workspace detection and package.json location types
export enum WorkspaceType {
  PNPM = 'pnpm',
  YARN = 'yarn',
  NPM = 'npm',
  NONE = 'none',
}

export type WorkspaceConfig = {
  readonly type: WorkspaceType;
  readonly workspaces: readonly string[];
}

export type PackageJsonLocation = {
  readonly path: string;
  readonly relativePath: string;
}
