import Parser from '../../../src/parser';

describe('.parse() logical', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('operator: =', () => {
    expect(parser.parse('10 = 10')).toMatchObject({error: null, result: true});

    expect(parser.parse('10 = 11')).toMatchObject({error: null, result: false});
  });

  it('operator: >', () => {
    expect(parser.parse('11 > 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 > 1.1')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 >- 10')).toMatchObject({error: null, result: true});

    expect(parser.parse('10 > 11')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 > 11.1')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 > 10.00001')).toMatchObject({error: null, result: false});
  });

  it('operator: <', () => {
    expect(parser.parse('10 < 11')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 < 11.1')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 < 10.00001')).toMatchObject({error: null, result: true});

    expect(parser.parse('11 < 10')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 < 1.1')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 <- 10')).toMatchObject({error: null, result: false});
  });

  it('operator: >=', () => {
    expect(parser.parse('11 >= 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('11 >= 11')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 >= 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('10 >= -10')).toMatchObject({error: null, result: true});

    expect(parser.parse('10 >= 11')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 >= 11.1')).toMatchObject({error: null, result: false});
    expect(parser.parse('10 >= 10.00001')).toMatchObject({error: null, result: false});
  });

  it('operator: <=', () => {
    expect(parser.parse('10 <= 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('1.1 <= 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('-10 <= 10')).toMatchObject({error: null, result: true});

    expect(parser.parse('11 <= 10')).toMatchObject({error: null, result: false});
    expect(parser.parse('11.1 <= 10')).toMatchObject({error: null, result: false});
    expect(parser.parse('10.00001 <= 10')).toMatchObject({error: null, result: false});
  });

  it('operator: <>', () => {
    expect(parser.parse('10 <> 11')).toMatchObject({error: null, result: true});
    expect(parser.parse('1.1 <> 10')).toMatchObject({error: null, result: true});
    expect(parser.parse('-10 <> 10')).toMatchObject({error: null, result: true});

    expect(parser.parse('10 <> 10')).toMatchObject({error: null, result: false});
    expect(parser.parse('11.1 <> 11.1')).toMatchObject({error: null, result: false});
    expect(parser.parse('10.00001 <> 10.00001')).toMatchObject({error: null, result: false});
  });
});
