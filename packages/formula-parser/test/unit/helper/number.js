import { toNumber, invertNumber } from "../../../src/helper/number";

describe(".toNumber()", () => {
  it("should correctly convert passed value into number", () => {
    expect(toNumber(-100)).toBe(-100);
    expect(toNumber(-1)).toBe(-1);
    expect(toNumber(19)).toBe(19);
    expect(toNumber(19.9)).toBe(19.9);
    expect(toNumber(0.9)).toBe(0.9);
    expect(toNumber("0.9")).toBe(0.9);
    expect(toNumber("0")).toBe(0);
    expect(toNumber("-10")).toBe(-10);
    expect(toNumber(" -10 ")).toBe(-10);
    expect(isNaN(toNumber("foo"))).toBe(true);
  });
});

describe(".invertNumber()", () => {
  it("should correctly invert number", () => {
    expect(invertNumber(-100)).toBe(100);
    expect(invertNumber(-1)).toBe(1);
    expect(invertNumber(19)).toBe(-19);
    expect(invertNumber(19.9)).toBe(-19.9);
    expect(invertNumber(0.9)).toBe(-0.9);
    expect(invertNumber("0.9")).toBe(-0.9);
    expect(invertNumber("0")).toBe(-0);
    expect(invertNumber("-10")).toBe(10);
    expect(invertNumber(" -10 ")).toBe(10);
    expect(isNaN(invertNumber("foo"))).toBe(true);
  });
});
