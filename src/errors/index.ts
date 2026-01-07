// Custom error classes for better error handling and type safety

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause);
  }
}

export class GitHubError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'GITHUB_ERROR', cause);
  }
}

export class FileNotFoundError extends AppError {
  constructor(path: string, cause?: unknown) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', cause);
  }
}

export class RepositoryError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'REPOSITORY_ERROR', cause);
  }
}

export class PackageError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PACKAGE_ERROR', cause);
  }
}
