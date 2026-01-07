#!/usr/bin/env node

import { prepare } from './utils/prepare';
import { generateBranchName } from './utils/branch';
import { setupRepository } from './utils/repo';
import { updateDependency } from './utils/package';
import { createPR } from './utils/pr';

const bootstrap = async (): Promise<void> => {
  const options = prepare();
  const branchName = generateBranchName(options.package, options.version);
  const repoPath = await setupRepository(options.repo, branchName);
  
  await updateDependency(repoPath, options.package, options.version);
  await createPR(repoPath, options.repo, branchName, options.package, options.version);
};

bootstrap().catch((error: Error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
