import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseArgs } from "./parseArgs";

const originalArgv = process.argv;

describe("parseArgs", () => {
  beforeEach(() => {
    process.argv = ["node", "script.js"];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("should parse valid arguments correctly", () => {
    process.argv = [
      "node",
      "script.js",
      "--repo",
      "owner/repo",
      "--package",
      "test-package",
      "--pkg-version",
      "1.2.3",
    ];

    const result = parseArgs();

    expect(result.repo).toBe("owner/repo");
    expect(result.package).toBe("test-package");
    expect(result.version).toBe("1.2.3");
  });

  it("should parse short form -v option", () => {
    process.argv = [
      "node",
      "script.js",
      "--repo",
      "owner/repo",
      "--package",
      "test-package",
      "-v",
      "1.2.3",
    ];

    const result = parseArgs();
    expect(result.version).toBe("1.2.3");
  });

  it("should clean version with v prefix", () => {
    process.argv = [
      "node",
      "script.js",
      "--repo",
      "owner/repo",
      "--package",
      "test-package",
      "--pkg-version",
      "v1.2.3",
    ];

    const result = parseArgs();
    expect(result.version).toBe("1.2.3");
  });
});
