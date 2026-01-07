#!/usr/bin/env node

import { parseArgs } from './cli/parseArgs.js';

const bootstrap = () => {
  const options = parseArgs();

  console.log('PR Bot started with options:');
  console.log({
    repository: options.repo,
    package: options.package,
    version: options.version
  });

  // TODO:
  // - authenticate with GitHub
  // - clone repository
  // - update package.json
  // - commit & push
  // - open pull request
}

bootstrap();