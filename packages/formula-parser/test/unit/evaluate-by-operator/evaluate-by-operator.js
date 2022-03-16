import evaluateByOperator, {registerOperation} from '../../../src/evaluate-by-operator/evaluate-by-operator';

describe('.registerOperation()', () => {
  it('should register new operator and evaluate it', () => {
    registerOperation('foo', (a, b) => a + b);

    expect(evaluateByOperator('foo', [2, 8.8])).toBe(10.8);
    expect(evaluateByOperator('foo', ['2', '8.8'])).toBe('28.8');
  });
});

describe('.evaluateByOperator()', () => {
  it('should throw exception when operator do not exist', () => {
    expect(() => {
      evaluateByOperator('bar', [2, 8.8]);
    }).toThrow('NAME');
    expect(() => {
      evaluateByOperator('baz');
    }).toThrow('NAME');
  });

  it('should not to throw exception for `add` operator', () => {
    expect(() => {
      evaluateByOperator('+', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `ampersand` operator', () => {
    expect(() => {
      evaluateByOperator('&', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `divide` operator', () => {
    expect(() => {
      evaluateByOperator('/', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `equal` operator', () => {
    expect(() => {
      evaluateByOperator('=', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `formula function` operator', () => {
    expect(() => {
      evaluateByOperator('SUM', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `greater than` operator', () => {
    expect(() => {
      evaluateByOperator('>', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `greater than or equal` operator', () => {
    expect(() => {
      evaluateByOperator('>=', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `less than` operator', () => {
    expect(() => {
      evaluateByOperator('<', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `less than or equal` operator', () => {
    expect(() => {
      evaluateByOperator('<=', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `minus` operator', () => {
    expect(() => {
      evaluateByOperator('-', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `multiply` operator', () => {
    expect(() => {
      evaluateByOperator('*', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `not equal` operator', () => {
    expect(() => {
      evaluateByOperator('<>', [2, 8.8]);
    }).not.toThrow();
  });

  it('should not to throw exception for `power` operator', () => {
    expect(() => {
      evaluateByOperator('^', [2, 2]);
    }).not.toThrow();
  });
});
