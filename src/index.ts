import { prepare } from "./utils/prepare";
import { generateBranchName } from "./utils/branch";
import { setupBranch } from "./utils/repo";
import { updateDependency } from "./utils/package";
import { createPR } from "./utils/pr";
import { logger } from "./services/logger";
import { AppError } from "./errors";

// Main application entry point
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

// TODO: Implement dry-run mode to show what would be done without making changes
// TODO: Add better error recovery and retry logic for transient GitHub API failures
bootstrap().catch((error) => {
  logger.error("Unexpected error occurred", error instanceof AppError ? error.code : 'UNKNOWN_ERROR');
  process.exit(1);
});
