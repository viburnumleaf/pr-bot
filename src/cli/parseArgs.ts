import { Command } from "commander";
import { cliOptionsSchema, type CliOptions } from "../schemas/cli";
import { parseOrExit } from "../utils/validation";

// Parses and validates command line arguments
// @throws {ValidationError} if arguments are invalid
export const parseArgs = (): CliOptions => {
  const program = new Command();

  program
    .requiredOption("-r, --repo <repo>", "GitHub repository (owner/name)")
    .requiredOption("-p, --package <name>", "NPM package name")
    .requiredOption("-v, --version <version>", "Target package version")
    .option("--path <path>", "Specific path to package.json (for monorepo workspaces)")
    .parse(process.argv);

  return parseOrExit(cliOptionsSchema, program.opts(), 'Invalid CLI arguments');
};
