import { Command } from "commander";

export const parseArgs = () => {
  const program = new Command();

  program.requiredOption("-r, --repo <repo>", "GitHub repository (owner/name)")
    .requiredOption("-p, --package <name>", "NPM package name")
    .requiredOption("-v, --version <version>", "Target package version")
    .parse(process.argv);

  return program.opts();
};
