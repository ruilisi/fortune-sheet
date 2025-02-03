/* eslint-disable import/no-named-as-default-member */
import func from "../../../../src/evaluate-by-operator/operator/less-than-or-equal";

describe("less than or equal operator", () => {
  it("should set SYMBOL const", () => {
    expect(func.SYMBOL).toBe("<=");
  });

  it("should correctly process values", () => {
    expect(func(2, 1)).toBe(false);
    expect(func(2.2, 2.1)).toBe(false);
    expect(func(void 0, null)).toBe(false);
    expect(func(0, void 0)).toBe(false);

    expect(func(0, null)).toBe(true); // JS natively
    expect(func(1, "1")).toBe(true);
    expect(func(1, 1)).toBe(true);
    expect(func("2", 8.8)).toBe(true);
    expect(func(2, 8.8)).toBe(true);
  });
});
