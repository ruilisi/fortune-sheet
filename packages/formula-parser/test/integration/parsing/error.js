import Parser from '../../../src/parser';

describe('.parse() error', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('should parse general error', () => {
    expect(parser.parse('#ERROR!')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#ERRfefweOR!')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse(' #ERRfefweOR! ')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse DIV/0 error', () => {
    expect(parser.parse('#DIV/0!')).toMatchObject({error: '#DIV/0!', result: null});
    expect(parser.parse('#DIV/0?')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#DIV/1!')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#DIV/')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse NAME error', () => {
    expect(parser.parse('#NAME?')).toMatchObject({error: '#NAME?', result: null});
    expect(parser.parse('#NAME!')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#NAMe!')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse N/A error', () => {
    expect(parser.parse('#N/A')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('#N/A!')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#N/A?')).toMatchObject({error: '#ERROR!', result: null});
    /* eslint-disable no-useless-escape */
    expect(parser.parse('#N\A')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse NULL error', () => {
    expect(parser.parse('#NULL!')).toMatchObject({error: '#NULL!', result: null});
    expect(parser.parse('#NULL?')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#NULl!')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse NUM error', () => {
    expect(parser.parse('#NUM!')).toMatchObject({error: '#NUM!', result: null});
    expect(parser.parse('#NUM?')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#NuM!')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse REF error', () => {
    expect(parser.parse('#REF!')).toMatchObject({error: '#REF!', result: null});
    expect(parser.parse('#REF?')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#REf!')).toMatchObject({error: '#ERROR!', result: null});
  });

  it('should parse VALUE error', () => {
    expect(parser.parse('#VALUE!')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('#VALUE?')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('#VALUe!')).toMatchObject({error: '#ERROR!', result: null});
  });
});
