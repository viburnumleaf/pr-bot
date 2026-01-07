import { describe, it, expect } from "vitest";
import {
  generateCommitMessage,
  generatePRTitle,
  checkExistingPR,
} from "./pr-validation";
import { GitHubClient } from "../services/github-client";

describe("generateCommitMessage", () => {
  it("should generate commit message with correct format", () => {
    const result = generateCommitMessage("test-package", "1.2.3");
    expect(result).toBe("chore(deps): bump test-package to 1.2.3");
  });
});

describe("generatePRTitle", () => {
  it("should generate PR title with correct format", () => {
    const result = generatePRTitle("test-package", "1.2.3");
    expect(result).toBe("Bump test-package to 1.2.3");
  });
});

describe("checkExistingPR", () => {
  it("should find existing PR by title match", async () => {
    const mockClient = {
      listPullRequests: async () => [
        {
          number: 1,
          title: "Bump test-package to 1.2.3",
          html_url: "https://github.com/owner/repo/pull/1",
          body: "",
        },
      ],
    } as unknown as GitHubClient;

    const result = await checkExistingPR(
      mockClient,
      "owner",
      "repo",
      "test-package",
      "1.2.3",
      "main"
    );

    expect(result.exists).toBe(true);
    expect(result.prNumber).toBe(1);
  });

  it("should return exists: false when no PR found", async () => {
    const mockClient = {
      listPullRequests: async () => [],
    } as unknown as GitHubClient;

    const result = await checkExistingPR(
      mockClient,
      "owner",
      "repo",
      "test-package",
      "1.2.3",
      "main"
    );

    expect(result.exists).toBe(false);
  });
});
