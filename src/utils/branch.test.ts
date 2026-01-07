import { describe, it, expect } from "vitest";
import { generateBranchName } from "./branch";

describe("generateBranchName", () => {
  it("should generate branch name with prefix", () => {
    const result = generateBranchName("test-package", "1.2.3");
    expect(result).toBe("chore/bump-test-package-1.2.3");
  });

  it("should replace forward slashes in package name", () => {
    const result = generateBranchName("@types/node", "20.0.0");
    expect(result).toBe("chore/bump-@types-node-20.0.0");
  });
});
