import { z } from 'zod';
import { valid, clean } from 'semver';

// Custom semver validation
const semverValidator = z.string().refine(
  (val) => {
    const cleaned = clean(val);
    return cleaned !== null && valid(cleaned) !== null;
  },
  {
    message: 'Version must be a valid semver version (e.g., 1.2.3, 1.0.0-alpha.1)'
  }
).transform((val) => {
  const cleaned = clean(val);
  return cleaned || val;
});

export const cliOptionsSchema = z.object({
  repo: z.string().min(1),
  package: z.string().min(1),
  version: semverValidator,
  path: z.string().optional(),
  baseBranch: z.string().optional(),
  dryRun: z.boolean().optional(),
  verbose: z.boolean().optional(),
});

export type CliOptions = z.infer<typeof cliOptionsSchema>;
