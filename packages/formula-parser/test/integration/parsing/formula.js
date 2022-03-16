import Parser from '../../../src/parser';

describe('.parse()', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('should return error when number of arguments is not valid', () => {
    /* eslint-disable */
    expect(parser.parse('ACOTH("foo")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse("ACOTH('foo')")).toMatchObject({error: '#VALUE!', result: null});
    /* eslint-enable */
  });

  it('should return error when used variable is not defined', () => {
    expect(parser.parse('ACOTH(foo)')).toMatchObject({error: '#NAME?', result: null});
  });

  it('should evaluate formula expression provided in lower case', () => {
    parser.setVariable('foo', [7, 3.5, 3.5, 1, 2]);

    expect(parser.parse('sum(2, 3, Rank.eq(2, foo))')).toMatchObject({error: null, result: 9});
  });
});
