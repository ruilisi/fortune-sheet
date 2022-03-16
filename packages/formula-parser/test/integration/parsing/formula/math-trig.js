import Parser from '../../../../src/parser';

describe('.parse() math-trig formulas', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  it('ABS', () => {
    expect(parser.parse('ABS()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ABS(-8)')).toMatchObject({error: null, result: 8});
    expect(parser.parse('ABS(-8.89)')).toMatchObject({error: null, result: 8.89});
    expect(parser.parse('ABS(8)')).toMatchObject({error: null, result: 8});
  });

  it('ACOS', () => {
    expect(parser.parse('ACOS()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ACOS(1)')).toMatchObject({error: null, result: 0});
    expect(parser.parse('ACOS(-1)')).toMatchObject({error: null, result: Math.PI});
  });

  it('ACOSH', () => {
    expect(parser.parse('ACOSH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ACOSH(1)')).toMatchObject({error: null, result: 0});
    expect(parser.parse('ACOSH(-1)')).toMatchObject({error: '#NUM!', result: null});
  });

  it('ACOT', () => {
    expect(parser.parse('ACOT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ACOT(1)')).toBeMatchCloseTo({error: null, result: 0.7853981633974483});
    expect(parser.parse('ACOT(-1)')).toBeMatchCloseTo({error: null, result: -0.7853981633974483});
  });

  it('ACOTH', () => {
    expect(parser.parse('ACOTH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ACOTH(1)')).toMatchObject({error: null, result: Infinity});
    expect(parser.parse('ACOTH(-1)')).toMatchObject({error: null, result: -Infinity});
  });

  it('ADD', () => {
    expect(parser.parse('ADD()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('ADD(3)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('ADD(3, 5, 6, 7, 1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('ADD(3, 5)')).toMatchObject({error: null, result: 8});
    expect(parser.parse('ADD(3.01, 5.02)')).toMatchObject({error: null, result: 8.03});
    expect(parser.parse('ADD(3, -5)')).toMatchObject({error: null, result: -2});
  });

  it('AGGREGATE', () => {
    parser.on('callRangeValue', (a, b, done) => {
      done([[1, 2, 3]]);
    });

    expect(parser.parse('AGGREGATE(1, 4, A1:C1)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('AGGREGATE(6, 4, A1:C1)')).toMatchObject({error: null, result: 6});
    expect(parser.parse('AGGREGATE(10, 4, A1:C1, 2)')).toMatchObject({error: null, result: 1});
  });

  it('ARABIC', () => {
    expect(parser.parse('ARABIC()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ARABIC("ABC")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ARABIC("X")')).toMatchObject({error: null, result: 10});
    expect(parser.parse('ARABIC("MXL")')).toMatchObject({error: null, result: 1040});
  });

  it('ASIN', () => {
    expect(parser.parse('ASIN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ASIN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ASIN(0.5)')).toBeMatchCloseTo({error: null, result: 0.5235987755982989});
  });

  it('ASINH', () => {
    expect(parser.parse('ASINH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ASINH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ASINH(0.5)')).toBeMatchCloseTo({error: null, result: 0.48121182505960347});
  });

  it('ATAN', () => {
    expect(parser.parse('ATAN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATAN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATAN(0.5)')).toBeMatchCloseTo({error: null, result: 0.4636476090008061});
  });

  it('ATAN2', () => {
    expect(parser.parse('ATAN2()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATAN2(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATAN2("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATAN2(1, 1)')).toBeMatchCloseTo({error: null, result: 0.7853981633974483});
  });

  it('ATANH', () => {
    expect(parser.parse('ATANH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATANH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ATANH(1)')).toMatchObject({error: null, result: Infinity});
  });

  it('BASE', () => {
    expect(parser.parse('BASE()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('BASE("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('BASE(7)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('BASE(7, 2)')).toMatchObject({error: null, result: '111'});
    expect(parser.parse('BASE(7, 2, 8)')).toMatchObject({error: null, result: '00000111'});
  });

  it('CEILING', () => {
    expect(parser.parse('CEILING()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CEILING("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CEILING(7.2)')).toMatchObject({error: null, result: 8});
    expect(parser.parse('CEILING(7, 2, 8)')).toMatchObject({error: null, result: 8});
    expect(parser.parse('CEILING(-4.3)')).toMatchObject({error: null, result: -4});
    expect(parser.parse('CEILING(-1.234, 0.1)')).toMatchObject({error: null, result: -1.2});
    expect(parser.parse('CEILING(-1.234, 0.1, "value")')).toMatchObject({error: '#VALUE!', result: null});
  });

  it('COMBIN', () => {
    expect(parser.parse('COMBIN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBIN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBIN(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBIN(0, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COMBIN(1, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COMBIN(3, 1)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('COMBIN(3, 3)')).toMatchObject({error: null, result: 1});
  });

  it('COMBINA', () => {
    expect(parser.parse('COMBINA()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBINA("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBINA(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COMBINA(0, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COMBINA(1, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COMBINA(3, 1)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('COMBINA(3, 3)')).toMatchObject({error: null, result: 10});
  });

  it('COS', () => {
    expect(parser.parse('COS()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COS("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COS(0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COS(1)')).toBeMatchCloseTo({error: null, result: 0.5403023058681398});
  });

  it('COSH', () => {
    expect(parser.parse('COSH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COSH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COSH(0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('COSH(1)')).toBeMatchCloseTo({error: null, result: 1.5430806348152437});
  });

  it('COT', () => {
    expect(parser.parse('COT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COT(0)')).toMatchObject({error: null, result: Infinity});
    expect(parser.parse('COT(1)')).toBeMatchCloseTo({error: null, result: 0.6420926159343306});
    expect(parser.parse('COT(2)')).toBeMatchCloseTo({error: null, result: -0.45765755436028577});
  });

  it('COTH', () => {
    expect(parser.parse('COTH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COTH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('COTH(0)')).toMatchObject({error: null, result: Infinity});
    expect(parser.parse('COTH(1)')).toBeMatchCloseTo({error: null, result: 1.3130352854993312});
    expect(parser.parse('COTH(2)')).toBeMatchCloseTo({error: null, result: 1.0373147207275482});
  });

  it('CSC', () => {
    expect(parser.parse('CSC()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CSC("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CSC(0)')).toMatchObject({error: null, result: Infinity});
    expect(parser.parse('CSC(1)')).toBeMatchCloseTo({error: null, result: 1.1883951057781212});
    expect(parser.parse('CSC(2)')).toBeMatchCloseTo({error: null, result: 1.0997501702946164});
  });

  it('CSCH', () => {
    expect(parser.parse('CSCH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CSCH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('CSCH(0)')).toMatchObject({error: null, result: Infinity});
    expect(parser.parse('CSCH(1)')).toBeMatchCloseTo({error: null, result: 0.8509181282393216});
    expect(parser.parse('CSCH(2)')).toBeMatchCloseTo({error: null, result: 0.27572056477178325});
  });

  it('DECIMAL', () => {
    expect(parser.parse('DECIMAL()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('DECIMAL("value")')).toBeMatchCloseTo({error: null, result: NaN});
    expect(parser.parse('DECIMAL(1.3)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('DECIMAL("0", 2)')).toMatchObject({error: null, result: 0});
    expect(parser.parse('DECIMAL("1010101", 2)')).toMatchObject({error: null, result: 85});
    expect(parser.parse('DECIMAL("32b", 16)')).toMatchObject({error: null, result: 811});
  });

  it('DEGREES', () => {
    expect(parser.parse('DEGREES()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('DEGREES("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('DEGREES(PI())')).toMatchObject({error: null, result: 180});
    expect(parser.parse('DEGREES(PI() / 2)')).toMatchObject({error: null, result: 90});
    expect(parser.parse('DEGREES(1.1)')).toBeMatchCloseTo({error: null, result: 63.02535746439057});
  });

  it('DIVIDE', () => {
    expect(parser.parse('DIVIDE()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('DIVIDE("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('DIVIDE(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('DIVIDE(0, 0)')).toMatchObject({error: '#DIV/0!', result: null});
    expect(parser.parse('DIVIDE(2, 0)')).toMatchObject({error: '#DIV/0!', result: null});
    expect(parser.parse('DIVIDE(0, 2)')).toMatchObject({error: null, result: 0});
  });

  it('EVEN', () => {
    expect(parser.parse('EVEN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('EVEN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('EVEN(1)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('EVEN(-33)')).toMatchObject({error: null, result: -34});
  });

  it('EQ', () => { // Equal
    expect(parser.parse('EQ()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('EQ("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('EQ(1, 1)')).toMatchObject({error: null, result: true});
    expect(parser.parse('EQ("foo", "foo")')).toMatchObject({error: null, result: true});
    expect(parser.parse('EQ("bar", "foo")')).toMatchObject({error: null, result: false});
    expect(parser.parse('EQ(12.2, 12.3)')).toMatchObject({error: null, result: false});
  });

  it('EXP', () => {
    expect(parser.parse('EXP()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('EXP(MY_VAR)')).toMatchObject({error: '#NAME?', result: null});
    expect(parser.parse('EXP("1")')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('EXP(1, 1)')).toMatchObject({error: '#ERROR!', result: null});
    expect(parser.parse('EXP(1)')).toMatchObject({error: null, result: 2.718281828459045});
  });

  it('FACT', () => {
    expect(parser.parse('FACT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FACT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FACT(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('FACT(3)')).toMatchObject({error: null, result: 6});
    expect(parser.parse('FACT(3.33)')).toMatchObject({error: null, result: 6});
    expect(parser.parse('FACT(6)')).toMatchObject({error: null, result: 720});
    expect(parser.parse('FACT(6.998)')).toMatchObject({error: null, result: 720});
    expect(parser.parse('FACT(10)')).toMatchObject({error: null, result: 3628800});
  });

  it('FACTDOUBLE', () => {
    expect(parser.parse('FACTDOUBLE()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FACTDOUBLE("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FACTDOUBLE(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('FACTDOUBLE(3)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('FACTDOUBLE(3.33)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('FACTDOUBLE(6)')).toMatchObject({error: null, result: 48});
    expect(parser.parse('FACTDOUBLE(6.998)')).toMatchObject({error: null, result: 48});
    expect(parser.parse('FACTDOUBLE(10)')).toMatchObject({error: null, result: 3840});
  });

  it('FLOOR', () => {
    expect(parser.parse('FLOOR()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FLOOR("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('FLOOR(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('FLOOR(3.33, 1.11)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('FLOOR(6.998, -1.99)')).toMatchObject({error: null, result: 6});
    expect(parser.parse('FLOOR(-1, -10)')).toMatchObject({error: null, result: -10});
  });

  it('GCD', () => {
    expect(parser.parse('GCD()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('GCD("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('GCD(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('GCD(2, 36)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('GCD(200, -12, 22, 9)')).toMatchObject({error: null, result: 1});
  });

  it('GTE', () => { // Greater than or equal
    expect(parser.parse('GTE()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('GTE("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('GTE(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('GTE(1, 2)')).toMatchObject({error: null, result: false});
    expect(parser.parse('GTE(1.1, 1.1)')).toMatchObject({error: null, result: true});
  });

  it('INT', () => {
    expect(parser.parse('INT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('INT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('INT(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('INT(1.1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('INT(1.5)')).toMatchObject({error: null, result: 1});
  });

  it('LCM', () => {
    expect(parser.parse('LCM()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LCM("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LCM(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('LCM(1.1, 2)')).toMatchObject({error: null, result: 2.2});
    expect(parser.parse('LCM(3, 8)')).toMatchObject({error: null, result: 24});
  });

  it('LN', () => {
    expect(parser.parse('LN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LN(1)')).toMatchObject({error: null, result: 0});
    expect(parser.parse(`LN(${Math.E})`)).toMatchObject({error: null, result: 1});
  });

  it('LOG', () => {
    expect(parser.parse('LOG()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LOG("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LOG(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LOG(10, 10)')).toMatchObject({error: null, result: 1});
  });

  it('LOG10', () => {
    expect(parser.parse('LOG10()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LOG10("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('LOG10(10)')).toMatchObject({error: null, result: 1});
  });

  it('LT', () => { // Less than
    expect(parser.parse('LT()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LT("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LT(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LT(1, 2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('LT(1.1, 1.2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('LT(1.2, 1.2)')).toMatchObject({error: null, result: false});
    expect(parser.parse('LT(1.3, 1.2)')).toMatchObject({error: null, result: false});
  });

  it('LTE', () => { // Less than or equal
    expect(parser.parse('LTE()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LTE("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LTE(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('LTE(1, 2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('LTE(1.1, 1.2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('LTE(1.2, 1.2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('LTE(1.3, 1.2)')).toMatchObject({error: null, result: false});
  });

  it('MINUS', () => {
    expect(parser.parse('MINUS()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MINUS("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MINUS(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MINUS(1, 2)')).toMatchObject({error: null, result: -1});
    expect(parser.parse('MINUS(1.1, 1.2)')).toBeMatchCloseTo({error: null, result: -0.1});
    expect(parser.parse('MINUS(1.2, 1.2)')).toMatchObject({error: null, result: 0});
    expect(parser.parse('MINUS(1.3, 1.2)')).toBeMatchCloseTo({error: null, result: 0.1});
  });

  it('MOD', () => {
    expect(parser.parse('MOD()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MOD("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MOD(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MOD(1, 2)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('MOD(3, 2)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('MOD(4, 0)')).toMatchObject({error: '#DIV/0!', result: null});
  });

  it('MROUND', () => {
    expect(parser.parse('MROUND()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MROUND("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MROUND(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MROUND(1, 2)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('MROUND(3, 2)')).toMatchObject({error: null, result: 4});
    expect(parser.parse('MROUND(-4, 1.1)')).toMatchObject({error: '#NUM!', result: null});
  });

  it('MULTINOMIAL', () => {
    expect(parser.parse('MULTINOMIAL()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MULTINOMIAL("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('MULTINOMIAL(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('MULTINOMIAL(1, 3, 4)')).toMatchObject({error: null, result: 280});
  });

  it('MULTIPLY', () => {
    expect(parser.parse('MULTIPLY()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MULTIPLY("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MULTIPLY(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('MULTIPLY(3, 4)')).toMatchObject({error: null, result: 12});
    expect(parser.parse('MULTIPLY(3, -4)')).toMatchObject({error: null, result: -12});
    expect(parser.parse('MULTIPLY(2, 2.2)')).toMatchObject({error: null, result: 4.4});
  });

  it('NE', () => { // Not Equal
    expect(parser.parse('NE()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('NE("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('NE(1)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('NE(3, 4)')).toMatchObject({error: null, result: true});
    expect(parser.parse('NE(3, -4)')).toMatchObject({error: null, result: true});
    expect(parser.parse('NE(2, 2.2)')).toMatchObject({error: null, result: true});
    expect(parser.parse('NE(2.2, 2.2)')).toMatchObject({error: null, result: false});
  });

  it('ODD', () => {
    expect(parser.parse('ODD()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ODD("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ODD(2)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('ODD(-34)')).toMatchObject({error: null, result: -35});
    expect(parser.parse('ODD(11)')).toMatchObject({error: null, result: 11});
  });

  it('PI', () => {
    expect(parser.parse('PI()')).toMatchObject({error: null, result: Math.PI});
  });

  it('POWER', () => {
    expect(parser.parse('POWER()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('POWER("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('POWER(2)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('POWER(2, 4)')).toMatchObject({error: null, result: 16});
    expect(parser.parse('POWER(2, 8)')).toMatchObject({error: null, result: 256});
  });

  it('POW', () => {
    expect(parser.parse('POW()')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('POW("value")')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('POW(2)')).toMatchObject({error: '#N/A', result: null});
    expect(parser.parse('POW(2, 4)')).toMatchObject({error: null, result: 16});
    expect(parser.parse('POW(2, 8)')).toMatchObject({error: null, result: 256});
  });

  it('PRODUCT', () => {
    expect(parser.parse('PRODUCT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('PRODUCT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('PRODUCT(2)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('PRODUCT(2, 4)')).toMatchObject({error: null, result: 8});
    expect(parser.parse('PRODUCT(2, 8)')).toMatchObject({error: null, result: 16});
    expect(parser.parse('PRODUCT(2, 8, 10, 10)')).toMatchObject({error: null, result: 1600});
  });

  it('QUOTIENT', () => {
    expect(parser.parse('QUOTIENT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('QUOTIENT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('QUOTIENT(2)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('QUOTIENT(2, 4)')).toMatchObject({error: null, result: 0});
    expect(parser.parse('QUOTIENT(8, 2)')).toMatchObject({error: null, result: 4});
    expect(parser.parse('QUOTIENT(9, 2)')).toMatchObject({error: null, result: 4});
    expect(parser.parse('QUOTIENT(-9, 2)')).toMatchObject({error: null, result: -4});
  });

  it('RADIANS', () => {
    expect(parser.parse('RADIANS()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('RADIANS("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('RADIANS(180)')).toMatchObject({error: null, result: Math.PI});
    expect(parser.parse('RADIANS(90)')).toMatchObject({error: null, result: Math.PI / 2});
  });

  it('RAND', () => {
    const result = parser.parse('RAND()');

    expect(result.error).toBeNull();
    expect(result.result).toBeGreaterThanOrEqual(0);
    expect(result.result).toBeLessThanOrEqual(1);
  });

  it('RANDBETWEEN', () => {
    const result = parser.parse('RANDBETWEEN(-5, -3)');

    expect(result.error).toBeNull();
    expect(result.result).toBeGreaterThanOrEqual(-5);
    expect(result.result).toBeLessThanOrEqual(-3);
  });

  it('ROMAN', () => {
    expect(parser.parse('ROMAN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROMAN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROMAN(1)')).toMatchObject({error: null, result: 'I'});
    expect(parser.parse('ROMAN(12)')).toMatchObject({error: null, result: 'XII'});
    expect(parser.parse('ROMAN(12)')).toMatchObject({error: null, result: 'XII'});
    expect(parser.parse('ROMAN(992)')).toMatchObject({error: null, result: 'CMXCII'});
    expect(parser.parse('ROMAN(2000)')).toMatchObject({error: null, result: 'MM'});
  });

  it('ROUND', () => {
    expect(parser.parse('ROUND()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUND("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUND(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUND(1.2234, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('ROUND(1.2234, 2)')).toMatchObject({error: null, result: 1.22});
    expect(parser.parse('ROUND(1.2234578, 4)')).toMatchObject({error: null, result: 1.2235});
    expect(parser.parse('ROUND(2345.2234578, -1)')).toMatchObject({error: null, result: 2350});
    expect(parser.parse('ROUND(2345.2234578, -2)')).toMatchObject({error: null, result: 2300});
  });

  it('ROUNDDOWN', () => {
    expect(parser.parse('ROUNDDOWN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDDOWN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDDOWN(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDDOWN(1.2234, 0)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('ROUNDDOWN(1.2234, 2)')).toMatchObject({error: null, result: 1.22});
    expect(parser.parse('ROUNDDOWN(1.2234578, 4)')).toMatchObject({error: null, result: 1.2234});
    expect(parser.parse('ROUNDDOWN(2345.2234578, -1)')).toMatchObject({error: null, result: 2340});
    expect(parser.parse('ROUNDDOWN(2345.2234578, -2)')).toMatchObject({error: null, result: 2300});
  });

  it('ROUNDUP', () => {
    expect(parser.parse('ROUNDUP()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDUP("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDUP(1)')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('ROUNDUP(1.2234, 0)')).toMatchObject({error: null, result: 2});
    expect(parser.parse('ROUNDUP(1.2234, 2)')).toMatchObject({error: null, result: 1.23});
    expect(parser.parse('ROUNDUP(1.2234578, 4)')).toMatchObject({error: null, result: 1.2235});
    expect(parser.parse('ROUNDUP(2345.2234578, -1)')).toMatchObject({error: null, result: 2350});
    expect(parser.parse('ROUNDUP(2345.2234578, -2)')).toMatchObject({error: null, result: 2400});
  });

  it('SEC', () => {
    expect(parser.parse('SEC()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SEC("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SEC(1)')).toBeMatchCloseTo({error: null, result: 1.8508157176809255});
    expect(parser.parse('SEC(30)')).toBeMatchCloseTo({error: null, result: 6.482921234962678});
  });

  it('SECH', () => {
    expect(parser.parse('SECH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SECH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SECH(1)')).toBeMatchCloseTo({error: null, result: 0.6480542736638855});
    expect(parser.parse('SECH(30)')).toBeMatchCloseTo({error: null, result: 1.8715245937680314e-13});
  });

  it('SERIESSUM', () => {
    parser.setVariable('SERIESSUM_ARR', [
      1,
      -1 / parser.parse('FACT(2)').result,
      1 / parser.parse('FACT(4)').result,
      -1 / parser.parse('FACT(6)').result,
    ]);

    expect(parser.parse('SERIESSUM(PI() / 4, 0, 2, SERIESSUM_ARR)')).toBeMatchCloseTo({error: null, result: 0.7071032148228457});
  });

  it('SIGN', () => {
    expect(parser.parse('SIGN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SIGN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SIGN(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('SIGN(30)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('SIGN(-1.1)')).toMatchObject({error: null, result: -1});
    expect(parser.parse('SIGN(0)')).toMatchObject({error: null, result: 0});
  });

  it('SIN', () => {
    expect(parser.parse('SIN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SIN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse(`SIN(${Math.PI / 2})`)).toMatchObject({error: null, result: 1});
  });

  it('SINH', () => {
    expect(parser.parse('SINH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SINH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SINH(1)')).toBeMatchCloseTo({error: null, result: 1.1752011936438014});
  });

  it('SQRT', () => {
    expect(parser.parse('SQRT()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SQRT("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SQRT(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('SQRT(9)')).toMatchObject({error: null, result: 3});
    expect(parser.parse('SQRT(64)')).toMatchObject({error: null, result: 8});
  });

  it('SQRTPI', () => {
    expect(parser.parse('SQRTPI()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SQRTPI("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SQRTPI(64)')).toBeMatchCloseTo({error: null, result: 14.179630807244127});
  });

  it('SUBTOTAL', () => {
    parser.on('callRangeValue', (a, b, done) => {
      done([[120, 10, 150, 23]]);
    });

    expect(parser.parse('SUBTOTAL(9, A1:C1)')).toMatchObject({error: null, result: 303});
  });

  it('SUM', () => {
    expect(parser.parse('SUM()')).toMatchObject({error: null, result: 0});
    expect(parser.parse('SUM("value")')).toMatchObject({error: null, result: 0});
    expect(parser.parse('SUM(64)')).toMatchObject({error: null, result: 64});
    expect(parser.parse('SUM(64, 3.3, 0.1)')).toBeMatchCloseTo({error: null, result: 67.4});
  });

  it('SUMIF', () => {
    parser.on('callRangeValue', (a, b, done) => {
      done([[1, 2, 3]]);
    });

    expect(parser.parse('SUMIF(A1:C1, ">2")')).toMatchObject({error: null, result: 3});
  });

  it('SUMIFS', () => {
    parser.on('callRangeValue', (a, b, done) => {
      done([[1, 2, 3]]);
    });

    expect(parser.parse('SUMIFS(A1:C1, ">1", "<3")')).toMatchObject({error: null, result: 2});
  });

  it('SUMPRODUCT', () => {
    parser.on('callRangeValue', (a, b, done) => {
      if (a.label === 'A1' && b.label === 'B3') {
        done([[3, 4], [8, 6], [1, 9]]);
      } else if (a.label === 'A4' && b.label === 'B6') {
        done([[2, 7], [6, 7], [5, 3]]);
      }
    });

    expect(parser.parse('SUMPRODUCT(A1:B3, A4:B6)')).toMatchObject({error: null, result: 156});
  });

  it('SUMSQ', () => {
    expect(parser.parse('SUMSQ()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SUMSQ("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('SUMSQ(64)')).toMatchObject({error: null, result: 4096});
    expect(parser.parse('SUMSQ(64, 3.3, 0.1)')).toBeMatchCloseTo({error: null, result: 4106.9});
  });

  it('SUMX2MY2', () => {
    parser.on('callRangeValue', (a, b, done) => {
      if (a.label === 'A1' && b.label === 'B3') {
        done([[1, 2, 3]]);
      } else if (a.label === 'A4' && b.label === 'B6') {
        done([[4, 5, 6]]);
      }
    });

    expect(parser.parse('SUMX2MY2(A1:B3, A4:B6)')).toMatchObject({error: null, result: -63});
  });

  it('SUMX2PY2', () => {
    parser.on('callRangeValue', (a, b, done) => {
      if (a.label === 'A1' && b.label === 'B3') {
        done([[1, 2, 3]]);
      } else if (a.label === 'A4' && b.label === 'B6') {
        done([[4, 5, 6]]);
      }
    });

    expect(parser.parse('SUMX2PY2(A1:B3, A4:B6)')).toMatchObject({error: null, result: 91});
  });

  it('SUMXMY2', () => {
    parser.on('callRangeValue', (a, b, done) => {
      if (a.label === 'A1' && b.label === 'B3') {
        done([[1, 2, 3]]);
      } else if (a.label === 'A4' && b.label === 'B6') {
        done([[4, 5, 6]]);
      }
    });

    expect(parser.parse('SUMXMY2(A1:B3, A4:B6)')).toMatchObject({error: null, result: 27});
  });

  it('TAN', () => {
    expect(parser.parse('TAN()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TAN("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TAN(1)')).toBeMatchCloseTo({error: null, result: 1.5574077246549023});
    expect(parser.parse('TAN(RADIANS(45))')).toBeMatchCloseTo({error: null, result: 1});
  });

  it('TANH', () => {
    expect(parser.parse('TANH()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TANH("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TANH(1)')).toBeMatchCloseTo({error: null, result: 0.761594155955765});
  });

  it('TRUNC', () => {
    expect(parser.parse('TRUNC()')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TRUNC("value")')).toMatchObject({error: '#VALUE!', result: null});
    expect(parser.parse('TRUNC(1)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('TRUNC(1.99988877)')).toMatchObject({error: null, result: 1});
    expect(parser.parse('TRUNC(-221.99988877)')).toMatchObject({error: null, result: -221});
    expect(parser.parse('TRUNC(0.99988877)')).toMatchObject({error: null, result: 0});
  });
});
