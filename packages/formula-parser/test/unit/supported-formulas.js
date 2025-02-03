import SUPPORTED_FORMULAS from "../../src/supported-formulas";

describe(".SUPPORTED_FORMULAS", () => {
  it("should be defined", () => {
    expect(SUPPORTED_FORMULAS.length).toBe(385);
  });
});
