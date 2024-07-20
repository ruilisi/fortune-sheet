/* eslint-disable import/no-named-as-default-member */
import func from "../../../../src/evaluate-by-operator/operator/power";

describe("power operator", () => {
  it("should set SYMBOL const", () => {
    expect(func.SYMBOL).toBe("^");
  });

  it("should correctly process values", () => {
    expect(func(2, 8.8)).toBe(445.7218884076158);
    expect(func("2", 8.8)).toBe(445.7218884076158);
    expect(func("2", "8.8")).toBe(445.7218884076158);
    expect(func("2", "8.8", 6, 0.4)).toBe(445.7218884076158);
    expect(() => func("foo", " ", "bar", " baz")).toThrow("VALUE");
    expect(() => func("foo", 2)).toThrow("VALUE");
  });
});
