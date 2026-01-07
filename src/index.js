#!/usr/bin/env node

import { parseArgs } from './cli/parseArgs.js';
import { getGitHubToken } from './git/auth.js';
import { cloneRepo } from './git/repo.js';

const bootstrap = async () => {
  const options = parseArgs();
  getGitHubToken(); // validate token

  const branchName = `chore/bump-${options.package.replace('/', '-')}-${options.version}`;

  const repoPath = await cloneRepo(options.repo, branchName);

  console.log('✅ Repository cloned and new branch created:');
  console.log(`Path: ${repoPath}`);
  console.log(`Branch: ${branchName}`);

  // TODO Phase 3:
  // - update package.json
  // - commit & push
  // - open pull request
}

bootstrap();