import { trimEdges } from "../../../src/helper/string";

describe(".trimEdges()", () => {
  it("should correctly trim edges", () => {
    expect(trimEdges("hello")).toBe("ell");
    expect(trimEdges("hello", 1)).toBe("ell");
    expect(trimEdges("hello", 2)).toBe("l");
  });
});
