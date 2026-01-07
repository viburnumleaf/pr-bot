// Workspace detection and package.json location types
export type WorkspaceType = 'pnpm' | 'yarn' | 'npm' | 'none';

export type WorkspaceConfig ={
  type: WorkspaceType;
  workspaces: string[];
}

export type PackageJsonLocation ={
  path: string;
  relativePath: string;
}
