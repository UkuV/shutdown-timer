import { describe, it, expect } from "vitest";
import { toTotalSeconds, formatCountdown, clampValue, actionLabels } from "./timer.js";

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

  it("returns 0 for negative hours", () => {
    expect(toTotalSeconds(-1, 0, 0)).toBe(0);
  });

  it("returns 0 for negative minutes", () => {
    expect(toTotalSeconds(0, -1, 0)).toBe(0);
  });

  it("returns 0 for negative seconds", () => {
    expect(toTotalSeconds(0, 0, -5)).toBe(0);
  });

  it("handles string inputs (from HTML inputs)", () => {
    expect(toTotalSeconds("2", "15", "30")).toBe(8130);
  });

  it("truncates float strings (parseInt behavior)", () => {
    expect(toTotalSeconds("1.9", "0", "0")).toBe(3600);
  });
});

describe("clampValue", () => {
  it("clamps hours above 23 to 23", () => {
    expect(clampValue(25, 0, 23)).toBe(23);
  });

  it("clamps minutes above 59 to 59", () => {
    expect(clampValue(60, 0, 59)).toBe(59);
  });

  it("clamps seconds above 59 to 59", () => {
    expect(clampValue(100, 0, 59)).toBe(59);
  });

  it("clamps negative values to 0", () => {
    expect(clampValue(-5, 0, 23)).toBe(0);
  });

  it("returns NaN as min", () => {
    expect(clampValue("abc", 0, 23)).toBe(0);
  });

  it("passes through valid values unchanged", () => {
    expect(clampValue(12, 0, 23)).toBe(12);
  });

  it("allows boundary values", () => {
    expect(clampValue(0, 0, 23)).toBe(0);
    expect(clampValue(23, 0, 23)).toBe(23);
  });

  it("clamps string '25' to 23 (as received from DOM input)", () => {
    expect(clampValue("25", 0, 23)).toBe(23);
  });

  it("clamps string '60' minutes to 59", () => {
    expect(clampValue("60", 0, 59)).toBe(59);
  });
});

describe("actionLabels", () => {
  it("has a label for each valid action", () => {
    const actions = ["shutdown", "restart", "sleep", "hibernate", "logoff", "lock"];
    actions.forEach((action) => {
      expect(actionLabels[action]).toBeTruthy();
    });
  });

  it("shutdown label is 'Shutting down'", () => {
    expect(actionLabels.shutdown).toBe("Shutting down");
  });

  it("restart label is 'Restarting'", () => {
    expect(actionLabels.restart).toBe("Restarting");
  });

  it("sleep label is 'Sleeping'", () => {
    expect(actionLabels.sleep).toBe("Sleeping");
  });

  it("hibernate label is 'Hibernating'", () => {
    expect(actionLabels.hibernate).toBe("Hibernating");
  });

  it("logoff label is 'Logging off'", () => {
    expect(actionLabels.logoff).toBe("Logging off");
  });

  it("lock label is 'Locking'", () => {
    expect(actionLabels.lock).toBe("Locking");
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
