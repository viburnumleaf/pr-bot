# PR Bot

Automated tool for creating Pull Requests with dependency updates in GitHub repositories.

## Description

PR Bot is a CLI tool that automatically:
- Creates a new branch for dependency updates
- Updates package version in `package.json` files (supports monorepo)
- Creates Pull Request with change description
- Checks for duplicate PRs before creation

## Installation

```bash
pnpm install
```

### Global link (for CLI usage)

```bash
# Build and link globally
pnpm build
pnpm link -g

# Now the pr-bot command is available system-wide
pr-bot --help
```

## Configuration

Create a `.env.local` file in the project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

**GITHUB_TOKEN** - GitHub Personal Access Token with write permissions to the repository (can be account-wide or repository-specific)

### Environment variables (when using global CLI)

You can provide `GITHUB_TOKEN` in any of these ways:

```bash
# 1) One-off (inline)
GITHUB_TOKEN=your_github_personal_access_token pr-bot --help

# 2) Export for current shell session
export GITHUB_TOKEN=your_github_personal_access_token
pr-bot --help
```

## Usage

### Basic example

```bash
pnpm start -- --repo owner/repo --package lodash --pkg-version 4.17.21
```

### Monorepo (with path specification)

```bash
pnpm start -- --repo owner/repo --package @types/node --pkg-version 20.0.0 --path packages/app
```

### With base branch specification

```bash
pnpm start -- --repo owner/repo --package react --pkg-version 18.2.0 --base-branch develop
```

### Dry-run mode

```bash
pnpm start -- --repo owner/repo --package express --pkg-version 4.18.0 --dry-run --verbose
```

## CLI Parameters

| Parameter | Short | Description | Required |
|-----------|-------|-------------|----------|
| `--repo` | `-r` | GitHub repository (owner/name) | ✅ |
| `--package` | `-p` | NPM package name | ✅ |
| `--pkg-version` | `-v` | Target package version | ✅ |
| `--path` | - | Path to package.json (for monorepo) | ❌ |
| `--base-branch` | - | Base branch for PR (default: repository default branch) | ❌ |
| `--dry-run` | - | Show what would be done without making changes | ❌ |
| `--verbose` | - | Enable verbose logging | ❌ |

## Project Structure

```
src/
├── cli/              # CLI arguments parsing and validation
├── constants/        # Application constants
├── errors/           # Custom error classes
├── git/              # GitHub API operations (auth, repo, PR)
├── package/          # package.json file updates
├── schemas/          # Zod validation schemas
├── services/         # Services (GitHub client, logger)
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

## Technologies

- **TypeScript** - type safety
- **Zod** - data validation
- **Commander** - CLI interface
- **Octokit** - GitHub API client
- **Vitest** - testing

## Features

- ✅ Monorepo support (pnpm, yarn, npm workspaces)
- ✅ Automatic workspace type detection
- ✅ Duplicate PR checking
- ✅ Semver version validation
- ✅ Structured error handling
- ✅ Support for `dependencies` and `devDependencies`

## TODO

See `// TODO` comments in the code for a list of planned improvements.
