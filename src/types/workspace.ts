// Workspace detection and package.json location types
export enum WorkspaceType {
  PNPM = 'pnpm',
  YARN = 'yarn',
  NPM = 'npm',
  NONE = 'none'
}

export type WorkspaceConfig ={
  type: WorkspaceType;
  workspaces: string[];
}

export type PackageJsonLocation ={
  path: string;
  relativePath: string;
}
