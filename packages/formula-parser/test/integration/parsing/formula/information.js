import Parser from "../../../../src/parser";

describe(".parse() information formulas", () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it("ISBINARY", () => {
    expect(parser.parse("ISBINARY()")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISBINARY(1)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISBINARY(0)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse('ISBINARY("1010")')).toMatchObject({
      error: null,
      result: true,
    });
  });

  it("ISBLANK", () => {
    expect(parser.parse("ISBLANK(NULL)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISBLANK(FALSE)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISBLANK(0)")).toMatchObject({
      error: null,
      result: false,
    });
  });

  it("ISEVEN", () => {
    expect(parser.parse("ISEVEN(1)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISEVEN(2)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISEVEN(2.5)")).toMatchObject({
      error: null,
      result: true,
    });
  });

  it("ISLOGICAL", () => {
    expect(parser.parse("ISLOGICAL(1)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISLOGICAL(TRUE)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISLOGICAL(FALSE)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISLOGICAL(NULL)")).toMatchObject({
      error: null,
      result: false,
    });
  });

  it("ISNONTEXT", () => {
    expect(parser.parse("ISNONTEXT()")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISNONTEXT(1)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISNONTEXT(TRUE)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse('ISNONTEXT("FALSE")')).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse('ISNONTEXT("foo")')).toMatchObject({
      error: null,
      result: false,
    });
  });

  it("ISNUMBER", () => {
    expect(parser.parse("ISNUMBER()")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISNUMBER(1)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISNUMBER(0.142342)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISNUMBER(TRUE)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse('ISNUMBER("FALSE")')).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse('ISNUMBER("foo")')).toMatchObject({
      error: null,
      result: false,
    });
  });

  it("ISODD", () => {
    expect(parser.parse("ISODD(1)")).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse("ISODD(2)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISODD(2.5)")).toMatchObject({
      error: null,
      result: false,
    });
  });

  it("ISTEXT", () => {
    expect(parser.parse("ISTEXT()")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISTEXT(1)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse("ISTEXT(TRUE)")).toMatchObject({
      error: null,
      result: false,
    });
    expect(parser.parse('ISTEXT("FALSE")')).toMatchObject({
      error: null,
      result: true,
    });
    expect(parser.parse('ISTEXT("foo")')).toMatchObject({
      error: null,
      result: true,
    });
  });
});
