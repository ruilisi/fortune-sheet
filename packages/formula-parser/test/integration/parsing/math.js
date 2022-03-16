import Parser from '../../../src/parser';

describe('.parse() math', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('operator: +', () => {
    expect(parser.parse('10+10')).toMatchObject({error: null, result: 20});
    expect(parser.parse('10 + 10')).toMatchObject({error: null, result: 20});
    expect(parser.parse('10 + 11 + 23 + 11 + 2')).toMatchObject({error: null, result: 57});
    expect(parser.parse('1.4425 + 4.333')).toMatchObject({error: null, result: 5.7755});
    expect(parser.parse('"foo" + 4.333')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('operator: -', () => {
    expect(parser.parse('10-10')).toMatchObject({error: null, result: 0});
    expect(parser.parse('10 - 10')).toMatchObject({error: null, result: 0});
    expect(parser.parse('10 - 10 - 2')).toMatchObject({error: null, result: -2});
    expect(parser.parse('10 - 11 - 23 - 11 - 2')).toMatchObject({error: null, result: -37});
    expect(parser.parse('"foo" - 4.333')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('operator: /', () => {
    expect(parser.parse('2 / 1')).toMatchObject({error: null, result: 2});
    expect(parser.parse('64 / 2 / 4')).toMatchObject({error: null, result: 8});
    expect(parser.parse('2 / 0')).toMatchObject({error: '#DIV/0!', result: null});
    expect(parser.parse('"foo" / 4.333')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('operator: *', () => {
    expect(parser.parse('0 * 0 * 0 * 0 * 0')).toMatchObject({error: null, result: 0});
    expect(parser.parse('2 * 1')).toMatchObject({error: null, result: 2});
    expect(parser.parse('64 * 2 * 4')).toMatchObject({error: null, result: 512});
    expect(parser.parse('"foo" * 4.333')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('operator: ^', () => {
    expect(parser.parse('2 ^ 5')).toMatchObject({error: null, result: 32});
    expect(parser.parse('"foo" ^ 4')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('operator: &', () => {
    expect(parser.parse('2 & 5')).toMatchObject({error: null, result: '25'});
    expect(parser.parse('(2 & 5)')).toMatchObject({error: null, result: '25'});
    expect(parser.parse('("" & "")')).toMatchObject({error: null, result: ''});
    expect(parser.parse('"" & ""')).toMatchObject({error: null, result: ''});
    expect(parser.parse('("Hello" & " world") & "!"')).toMatchObject({error: null, result: 'Hello world!'});
  });

  it('mixed operators', () => {
    expect(parser.parse('1 + 10 - 20 * 3/2')).toMatchObject({error: null, result: -19});
    expect(parser.parse('((1 + 10 - 20 * 3 / 2) + 20) * 10')).toMatchObject({error: null, result: 10});
    expect(parser.parse('(((1 + 10 - 20 * 3/2) + 20) * 10) / 5.12')).toMatchObject({error: null, result: 1.953125});
    expect(parser.parse('(((1 + "foo" - 20 * 3/2) + 20) * 10) / 5.12')).toMatchObject({error: '#VALUE!', result: null});
  });
});
