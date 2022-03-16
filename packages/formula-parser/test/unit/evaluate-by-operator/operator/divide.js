/* eslint-disable import/no-named-as-default-member */
import func from '../../../../src/evaluate-by-operator/operator/divide';

describe('divide operator', () => {
  it('should set SYMBOL const', () => {
    expect(func.SYMBOL).toBe('/');
  });

  it('should correctly process values', () => {
    expect(func(2, 8.8)).toBe(0.22727272727272727);
    expect(func('2', 8.8)).toBe(0.22727272727272727);
    expect(func('2', '-8.8', 6, 0.4)).toBe(-0.0946969696969697);
    expect(() => func('foo', ' ', 'bar', ' baz')).toThrow('VALUE');
    expect(func(0, 1)).toBe(0);
    expect(() => func(1, 0)).toThrow('DIV/0');
  });
});
