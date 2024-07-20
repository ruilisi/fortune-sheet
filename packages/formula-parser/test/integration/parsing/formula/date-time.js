import Parser from "../../../../src/parser";

describe(".parse() date & time formulas", () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it("DATE", () => {
    expect(parser.parse("DATE()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });

    const { error, result } = parser.parse("DATE(2001, 5, 12)");

    expect(error).toBeNull();
    expect(result.getFullYear()).toBe(2001);
    expect(result.getMonth()).toBe(4); // counting from zero
    expect(result.getDate()).toBe(12);
  });

  it("DATEVALUE", () => {
    expect(parser.parse("DATEVALUE()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('DATEVALUE("1/1/1900")')).toMatchObject({
      error: null,
      result: 1,
    });
    expect(parser.parse('DATEVALUE("1/1/2000")')).toMatchObject({
      error: null,
      result: 36526,
    });
  });

  it("DAY", () => {
    expect(parser.parse("DAY()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("DAY(1)")).toMatchObject({ error: null, result: 1 });
    expect(parser.parse("DAY(2958465)")).toMatchObject({
      error: null,
      result: 31,
    });
    expect(parser.parse('DAY("2958465")')).toMatchObject({
      error: null,
      result: 31,
    });
  });

  it("DAYS", () => {
    expect(parser.parse("DAYS()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("DAYS(1)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("DAYS(1, 6)")).toMatchObject({
      error: null,
      result: -5,
    });
    expect(parser.parse('DAYS("1/2/2000", "1/10/2001")')).toMatchObject({
      error: null,
      result: -374,
    });
  });

  it("DAYS360", () => {
    expect(parser.parse("DAYS360()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("DAYS360(1)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("DAYS360(1, 6)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('DAYS360("1/1/1901", "2/1/1901", TRUE)')).toMatchObject(
      { error: null, result: 30 }
    );
    expect(
      parser.parse('DAYS360("1/1/1901", "12/31/1901", FALSE)')
    ).toMatchObject({ error: null, result: 360 });
  });

  it("EDATE", () => {
    expect(parser.parse("EDATE()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("EDATE(1)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('EDATE("1/1/1900", 1)')).toMatchObject({
      error: null,
      result: 32,
    });
  });

  it("EOMONTH", () => {
    expect(parser.parse("EOMONTH()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("EOMONTH(1)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('EOMONTH("1/1/1900", 1)')).toMatchObject({
      error: null,
      result: 59,
    });
  });

  it("HOUR", () => {
    expect(parser.parse("HOUR()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('HOUR("1/1/1900 16:33")')).toMatchObject({
      error: null,
      result: 16,
    });
  });

  it("INTERVAL", () => {
    expect(parser.parse("INTERVAL()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("INTERVAL(0)")).toMatchObject({
      error: null,
      result: "PT",
    });
    expect(parser.parse("INTERVAL(1)")).toMatchObject({
      error: null,
      result: "PT1S",
    });
    expect(parser.parse("INTERVAL(60)")).toMatchObject({
      error: null,
      result: "PT1M",
    });
    expect(parser.parse("INTERVAL(10000000)")).toMatchObject({
      error: null,
      result: "P3M25DT17H46M40S",
    });
  });

  it("ISOWEEKNUM", () => {
    expect(parser.parse("ISOWEEKNUM()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('ISOWEEKNUM("1/8/1901")')).toMatchObject({
      error: null,
      result: 2,
    });
    expect(parser.parse('ISOWEEKNUM("6/6/1902")')).toMatchObject({
      error: null,
      result: 23,
    });
  });

  it("MINUTE", () => {
    expect(parser.parse("MINUTE()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('MINUTE("1/1/1901 1:01")')).toMatchObject({
      error: null,
      result: 1,
    });
    expect(parser.parse('MINUTE("1/1/1901 15:36")')).toMatchObject({
      error: null,
      result: 36,
    });
  });

  it("MONTH", () => {
    expect(parser.parse("MONTH()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('MONTH("2/1/1901")')).toMatchObject({
      error: null,
      result: 2,
    });
    expect(parser.parse('MONTH("10/1/1901")')).toMatchObject({
      error: null,
      result: 10,
    });
  });

  it("NETWORKDAYS", () => {
    expect(parser.parse("NETWORKDAYS()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('NETWORKDAYS("2/1/1901")')).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(
      parser.parse('NETWORKDAYS("2013-12-04", "2013-12-05")')
    ).toMatchObject({ error: null, result: 2 });
    expect(
      parser.parse('NETWORKDAYS("2013-11-04", "2013-12-05")')
    ).toMatchObject({ error: null, result: 24 });
  });

  it("NOW", () => {
    const { error, result } = parser.parse("NOW()");
    const now = new Date();

    expect(error).toBeNull();
    expect(result.toString()).toBe(now.toString());
  });

  it("SECOND", () => {
    expect(parser.parse("SECOND()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('SECOND("2/1/1901 13:33:12")')).toMatchObject({
      error: null,
      result: 12,
    });
  });

  it("TIME", () => {
    expect(parser.parse("TIME()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("TIME(0)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("TIME(0, 0)")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse("TIME(0, 0, 0)")).toMatchObject({
      error: null,
      result: 0,
    });
    expect(parser.parse("TIME(1, 1, 1)")).toMatchObject({
      error: null,
      result: 0.04237268518518519,
    });
    expect(parser.parse("TIME(24, 0, 0)")).toMatchObject({
      error: null,
      result: 1,
    });
  });

  it("TIMEVALUE", () => {
    expect(parser.parse("TIMEVALUE()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('TIMEVALUE("1/1/1900 00:00:00")')).toMatchObject({
      error: null,
      result: 0,
    });
    expect(parser.parse('TIMEVALUE("1/1/1900 23:00:00")')).toMatchObject({
      error: null,
      result: 0.9583333333333334,
    });
  });

  it("TODAY", () => {
    const { error, result } = parser.parse("TODAY()");
    const now = new Date();

    expect(error).toBeNull();
    expect(result.getDate()).toBe(now.getDate());
  });

  it("WEEKDAY", () => {
    expect(parser.parse("WEEKDAY()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('WEEKDAY("1/1/1901")')).toMatchObject({
      error: null,
      result: 3,
    });
    expect(parser.parse('WEEKDAY("1/1/1901", 2)')).toMatchObject({
      error: null,
      result: 2,
    });
  });

  it("WEEKNUM", () => {
    expect(parser.parse("WEEKNUM()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('WEEKNUM("2/1/1900")')).toMatchObject({
      error: null,
      result: 5,
    });
    expect(parser.parse('WEEKNUM("2/1/1909", 2)')).toMatchObject({
      error: null,
      result: 6,
    });
  });

  it("WORKDAY", () => {
    expect(parser.parse("WORKDAY()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('WORKDAY("1/1/1900")')).toMatchObject({
      error: "#VALUE!",
      result: null,
    });

    const { result, error } = parser.parse('WORKDAY("1/1/1900", 1)');

    expect(error).toBeNull();
    expect(result.getDate()).toBe(2);
  });

  it("YEAR", () => {
    expect(parser.parse("YEAR()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('YEAR("1/1/1904")')).toMatchObject({
      error: null,
      result: 1904,
    });
    expect(parser.parse('YEAR("12/12/2001")')).toMatchObject({
      error: null,
      result: 2001,
    });
  });

  it("YEARFRAC", () => {
    expect(parser.parse("YEARFRAC()")).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('YEARFRAC("1/1/1904")')).toMatchObject({
      error: "#VALUE!",
      result: null,
    });
    expect(parser.parse('YEARFRAC("1/1/1900", "1/2/1900")')).toMatchObject({
      error: null,
      result: 0.002777777777777778,
    });
  });
});
