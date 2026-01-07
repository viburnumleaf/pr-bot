import { Command } from "commander";
import { cliOptionsSchema, type CliOptions } from "../schemas/cli";
import { parseOrExit } from "../utils/validation";

// Parses and validates command line arguments
export const parseArgs = (): CliOptions => {
  const program = new Command();

  program
    .name("pr-bot")
    .description("Automated dependency update PR creator for GitHub repositories")
    // TODO: Read version dynamically from package.json instead of hardcoding
    .version("0.1.0", "-V, --version", "Display version number")
    .helpOption("-h, --help", "Display help for command")
    .requiredOption("-r, --repo <repo>", "GitHub repository (owner/name)")
    .requiredOption("-p, --package <name>", "NPM package name")
    .requiredOption("-v, --pkg-version <version>", "Target package version")
    .option("--path <path>", "Specific path to package.json (for monorepo workspaces)")
    .option("--base-branch <branch>", "Base branch for PR (default: repository default branch)")
    .option("--dry-run", "Show what would be done without making changes")
    .option("--verbose", "Enable verbose logging")
    .configureHelp({
      // Show -v as alias for --pkg-version in help
      optionTerm: (option) => {
        if (option.long === "--pkg-version") {
          return "-v, --pkg-version <version>";
        }
        return option.flags;
      },
    })
    .addHelpText(
      "after",
      `
Examples:
  $ pr-bot --repo owner/repo --package lodash --pkg-version 4.17.21
  $ pr-bot -r owner/repo -p @types/node -v 20.0.0 --path packages/app
  $ pr-bot -r owner/repo -p react -v 18.2.0 --base-branch develop
  $ pr-bot -r owner/repo -p express -v 4.18.0 --dry-run --verbose

Environment Variables:
  GITHUB_TOKEN    GitHub personal access token (required)
  GITHUB_NAME     Repository name in format owner/repo (must match --repo parameter)
    `
    );

  program.parse(process.argv);

  const opts = program.opts();
  
  // Map pkgVersion back to version for schema validation
  if (opts.pkgVersion) {
    opts.version = opts.pkgVersion;
    delete opts.pkgVersion;
  }
  
  // Map baseBranch to baseBranch option
  const result = parseOrExit(cliOptionsSchema, opts, "Invalid CLI arguments");
  
  // Add additional options that are not in schema
  return {
    ...result,
    baseBranch: opts.baseBranch,
    dryRun: opts.dryRun || false,
    verbose: opts.verbose || false,
  } as CliOptions;
};
