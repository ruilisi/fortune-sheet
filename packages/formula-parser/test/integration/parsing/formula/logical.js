import Parser from '../../../../src/parser';

describe('.parse() logical formulas', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('AND', () => {
    expect(parser.parse('AND()')).toMatchObject({error: null, result: true});
    expect(parser.parse('AND(TRUE, TRUE, FALSE)')).toMatchObject({error: null, result: false});
    expect(parser.parse('AND(TRUE, TRUE, TRUE)')).toMatchObject({error: null, result: true});
  });

  it('CHOOSE', () => {
    expect(parser.parse('CHOOSE()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('CHOOSE(1, "foo", "bar", "baz")')).toMatchObject({error: null, result: 'foo'});
    expect(parser.parse('CHOOSE(3, "foo", "bar", "baz")')).toMatchObject({error: null, result: 'baz'});
    expect(parser.parse('CHOOSE(4, "foo", "bar", "baz")')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('FALSE', () => {
    expect(parser.parse('FALSE()')).toMatchObject({error: null, result: false});
  });

  it('IF', () => {
    expect(parser.parse('IF()')).toMatchObject({error: null, result: true});
    expect(parser.parse('IF(TRUE, 1, 2)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('IF(FALSE, 1, 2)')).toMatchObject({error: null, result: 2});
  });

  it('NOT', () => {
    expect(parser.parse('NOT()')).toMatchObject({error: null, result: true});
    expect(parser.parse('NOT(TRUE)')).toMatchObject({error: null, result: false});
    expect(parser.parse('NOT(FALSE)')).toMatchObject({error: null, result: true});
    expect(parser.parse('NOT(0)')).toMatchObject({error: null, result: true});
    expect(parser.parse('NOT(1)')).toMatchObject({error: null, result: false});
  });

  it('OR', () => {
    expect(parser.parse('OR()')).toMatchObject({error: null, result: false});
    expect(parser.parse('OR(TRUE, TRUE, TRUE)')).toMatchObject({error: null, result: true});
    expect(parser.parse('OR(TRUE, FALSE, FALSE)')).toMatchObject({error: null, result: true});
    expect(parser.parse('OR(FALSE, FALSE, FALSE)')).toMatchObject({error: null, result: false});
  });

  it('TRUE', () => {
    expect(parser.parse('TRUE()')).toMatchObject({error: null, result: true});
  });

  it('XOR', () => {
    expect(parser.parse('XOR()')).toMatchObject({error: null, result: false});
    expect(parser.parse('XOR(TRUE, TRUE)')).toMatchObject({error: null, result: false});
    expect(parser.parse('XOR(TRUE, FALSE)')).toMatchObject({error: null, result: true});
    expect(parser.parse('XOR(FALSE, TRUE)')).toMatchObject({error: null, result: true});
    expect(parser.parse('XOR(FALSE, FALSE)')).toMatchObject({error: null, result: false});
  });

  it('SWITCH', () => {
    expect(parser.parse('SWITCH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SWITCH(7, "foo")')).toMatchObject({error: null, result: 'foo'});
    expect(parser.parse('SWITCH(7, 9, "foo", 7, "bar")')).toMatchObject({error: null, result: 'bar'});
    expect(parser.parse('SWITCH(10, 9, "foo", 7, "bar")')).toMatchObject({error: '#N/A', result: null});
  });
});
