import { Command } from "commander";
import type { CliOptions } from "../types/cli";

export const parseArgs = (): CliOptions => {
  const program = new Command();

  program.requiredOption("-r, --repo <repo>", "GitHub repository (owner/name)")
    .requiredOption("-p, --package <name>", "NPM package name")
    .requiredOption("-v, --version <version>", "Target package version")
    .parse(process.argv);

  return program.opts() as CliOptions;
};
