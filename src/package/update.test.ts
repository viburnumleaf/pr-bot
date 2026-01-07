import { describe, it, expect } from "vitest";
import {
  updatePackageJsonContent,
  updateMultiplePackageJson,
} from "./update";
import { PackageError } from "../errors";

describe("updatePackageJsonContent", () => {
  it("should update dependency version", () => {
    const content = JSON.stringify({
      dependencies: { "test-package": "1.0.0" },
    });

    const result = updatePackageJsonContent(content, "test-package", "2.0.0");

    expect(result.updated).toBe(true);
    expect(result.updatedIn).toBe("dependencies");
    expect(JSON.parse(result.newContent).dependencies["test-package"]).toBe("2.0.0");
  });

  it("should throw PackageError for invalid JSON", () => {
    expect(() =>
      updatePackageJsonContent("{ invalid }", "test-package", "2.0.0")
    ).toThrow(PackageError);
  });
});

describe("updateMultiplePackageJson", () => {
  it("should update multiple package.json files", () => {
    const files = [
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: { "test-package": "1.0.0" },
        }),
      },
      {
        path: "packages/app/package.json",
        content: JSON.stringify({
          dependencies: { "test-package": "1.0.0" },
        }),
      },
    ];

    const result = updateMultiplePackageJson(files, "test-package", "2.0.0");

    expect(result.updated).toBe(true);
    expect(result.totalUpdated).toBe(2);
  });

  it("should throw PackageError when package not found", () => {
    const files = [
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: { "other-package": "1.0.0" },
        }),
      },
    ];

    expect(() =>
      updateMultiplePackageJson(files, "test-package", "2.0.0")
    ).toThrow(PackageError);
  });
});
