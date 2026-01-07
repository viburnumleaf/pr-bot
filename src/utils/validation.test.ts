import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseOrExit } from "./validation";
import { ValidationError } from "../errors";

describe("parseOrExit", () => {
  it("should parse valid data correctly", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const data = { name: "John", age: 30 };
    const result = parseOrExit(schema, data, "Invalid data");

    expect(result).toEqual(data);
  });

  it("should throw ValidationError for invalid data", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const data = { name: "John", age: "30" };

    expect(() => parseOrExit(schema, data, "Invalid data")).toThrow(
      ValidationError
    );
  });
});
