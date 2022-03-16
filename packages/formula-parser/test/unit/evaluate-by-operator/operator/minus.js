/* eslint-disable import/no-named-as-default-member */
import func from '../../../../src/evaluate-by-operator/operator/minus';

describe('minus operator', () => {
  it('should set SYMBOL const', () => {
    expect(func.SYMBOL).toBe('-');
  });

  it('should correctly process values', () => {
    expect(func(2, 8.8)).toBe(-6.800000000000001);
    expect(func('2', 8.8)).toBe(-6.800000000000001);
    expect(func('2', '8.8')).toBe(-6.800000000000001);
    expect(func('2', '-8.8', 6, 0.4)).toBe(4.4);
    expect(() => func('foo', ' ', 'bar', ' baz')).toThrow('VALUE');
    expect(() => func('foo', 2)).toThrow('VALUE');
  });
});
