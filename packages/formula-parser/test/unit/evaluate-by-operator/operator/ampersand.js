/* eslint-disable import/no-named-as-default-member */
import func from '../../../../src/evaluate-by-operator/operator/ampersand';

describe('ampersand operator', () => {
  it('should set SYMBOL const', () => {
    expect(func.SYMBOL).toBe('&');
  });

  it('should correctly process values', () => {
    expect(func(2, 8.8)).toBe('28.8');
    expect(func('2', 8.8)).toBe('28.8');
    expect(func('2', '-8.8', 6, 0.4)).toBe('2-8.860.4');
    expect(func('foo', ' ', 'bar', ' baz')).toBe('foo bar baz');
  });
});
