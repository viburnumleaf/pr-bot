#!/usr/bin/env node

import { prepare } from './utils/prepare.js';
import { generateBranchName } from './utils/branch.js';
import { setupRepository } from './utils/repo.js';
import { updateDependency } from './utils/package.js';
import { createPR } from './utils/pr.js';

const bootstrap = async () => {
  const options = prepare();
  const branchName = generateBranchName(options.package, options.version);
  const repoPath = await setupRepository(options.repo, branchName);
  
  await updateDependency(repoPath, options.package, options.version);
  await createPR(repoPath, options.repo, branchName, options.package, options.version);
};

bootstrap().catch((error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});