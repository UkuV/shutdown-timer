import { describe, it, expect } from "vitest";
import { toTotalSeconds, formatCountdown } from "./timer.js";

describe("toTotalSeconds", () => {
  it("converts hours, minutes, seconds to total seconds", () => {
    expect(toTotalSeconds(1, 30, 0)).toBe(5400);
  });

  it("returns 0 when all inputs are 0", () => {
    expect(toTotalSeconds(0, 0, 0)).toBe(0);
  });

  it("handles seconds-only input", () => {
    expect(toTotalSeconds(0, 0, 45)).toBe(45);
  });

  it("returns 0 for negative values", () => {
    expect(toTotalSeconds(-1, 0, 0)).toBe(0);
  });

  it("handles string inputs (from HTML inputs)", () => {
    expect(toTotalSeconds("2", "15", "30")).toBe(8130);
  });
});

describe("formatCountdown", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatCountdown(3661)).toBe("01:01:01");
  });

  it("pads single digits with zeros", () => {
    expect(formatCountdown(65)).toBe("00:01:05");
  });

  it("formats zero as 00:00:00", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
  });
});
