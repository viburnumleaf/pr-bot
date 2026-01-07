#!/usr/bin/env node

import { prepare } from './utils/prepare';
import { generateBranchName } from './utils/branch';
import { setupBranch } from './utils/repo';
import { updateDependency } from './utils/package';
import { createPR } from './utils/pr';

const bootstrap = async (): Promise<void> => {
  const options = prepare();
  const branchName = generateBranchName(options.package, options.version);
  
  // Get base branch and create new branch
  const baseBranch = await setupBranch(options.repo, branchName);
  
  // Get file updates from base branch
  const { fileUpdates } = await updateDependency(
    options.repo,
    baseBranch,
    options.package,
    options.version,
    options
  );
  
  // Create PR with updates (files will be updated in the new branch)
  await createPR(
    options.repo,
    branchName,
    baseBranch,
    options.package,
    options.version,
    fileUpdates
  );
};

bootstrap().catch((error: Error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
