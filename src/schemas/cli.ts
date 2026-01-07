import { z } from 'zod';

export const cliOptionsSchema = z.object({
  repo: z.string().min(1),
  package: z.string().min(1),
  version: z.string().min(1),
  path: z.string().optional()
});

export type CliOptions = z.infer<typeof cliOptionsSchema>;
