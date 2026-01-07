import { describe, it, expect } from "vitest";
import { cliOptionsSchema } from "./cli";

describe("cliOptionsSchema - version validation", () => {
  it("should accept valid semver versions", () => {
    const result = cliOptionsSchema.safeParse({
      repo: "owner/repo",
      package: "test-package",
      version: "1.2.3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("1.2.3");
    }
  });

  it("should clean versions with v prefix", () => {
    const result = cliOptionsSchema.safeParse({
      repo: "owner/repo",
      package: "test-package",
      version: "v1.2.3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("1.2.3");
    }
  });

  it("should reject invalid version formats", () => {
    const result = cliOptionsSchema.safeParse({
      repo: "owner/repo",
      package: "test-package",
      version: "invalid",
    });

    expect(result.success).toBe(false);
  });
});
