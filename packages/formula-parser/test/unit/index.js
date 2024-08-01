import * as lib from "../../src/index";

describe("Public API", () => {
  it("Parser should be defined", () => {
    expect(lib.Parser).toBeInstanceOf(Function);
  });

  it("SUPPORTED_FORMULAS should be defined", () => {
    expect(lib.SUPPORTED_FORMULAS).toBeInstanceOf(Array);
  });

  it("ERROR should be defined", () => {
    expect(lib.ERROR).toBeDefined();
  });

  it("ERROR_DIV_ZERO should be defined", () => {
    expect(lib.ERROR_DIV_ZERO).toBeDefined();
  });

  it("ERROR_NAME should be defined", () => {
    expect(lib.ERROR_NAME).toBeDefined();
  });

  it("ERROR_NOT_AVAILABLE should be defined", () => {
    expect(lib.ERROR_NOT_AVAILABLE).toBeDefined();
  });

  it("ERROR_NULL should be defined", () => {
    expect(lib.ERROR_NULL).toBeDefined();
  });

  it("ERROR_NUM should be defined", () => {
    expect(lib.ERROR_NUM).toBeDefined();
  });

  it("ERROR_REF should be defined", () => {
    expect(lib.ERROR_REF).toBeDefined();
  });

  it("ERROR_VALUE should be defined", () => {
    expect(lib.ERROR_VALUE).toBeDefined();
  });

  it("error should be defined", () => {
    expect(lib.error).toBeDefined();
  });

  it("extractLabel should be defined", () => {
    expect(lib.extractLabel).toBeDefined();
  });

  it("toLabel should be defined", () => {
    expect(lib.toLabel).toBeDefined();
  });

  it("columnIndexToLabel should be defined", () => {
    expect(lib.columnIndexToLabel).toBeDefined();
  });

  it("columnLabelToIndex should be defined", () => {
    expect(lib.columnLabelToIndex).toBeDefined();
  });

  it("rowIndexToLabel should be defined", () => {
    expect(lib.rowIndexToLabel).toBeDefined();
  });

  it("rowLabelToIndex should be defined", () => {
    expect(lib.rowLabelToIndex).toBeDefined();
  });
});
