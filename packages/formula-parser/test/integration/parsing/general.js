import Parser from "../../../src/parser";

describe(".parse() general", () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it("should parse an empty string as it is", () => {
    expect(parser.parse("")).toMatchObject({ error: null, result: "" });
  });

  it("should not parse an number type data", () => {
    expect(parser.parse(200)).toMatchObject({ error: "#ERROR!", result: null });
    expect(parser.parse(20.1)).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });

  it("should not parse null type data", () => {
    expect(parser.parse(null)).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });

  it("should not parse undefined type data", () => {
    expect(parser.parse(void 0)).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });

  it("should not parse object type data", () => {
    expect(parser.parse({})).toMatchObject({ error: "#ERROR!", result: null });
    expect(parser.parse({ a: 1 })).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });

  it("should not parse array type data", () => {
    expect(parser.parse([])).toMatchObject({ error: "#ERROR!", result: null });
    expect(parser.parse([1, 2])).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });

  it("should not parse array type data", () => {
    expect(parser.parse(() => {})).toMatchObject({
      error: "#ERROR!",
      result: null,
    });
  });
});
