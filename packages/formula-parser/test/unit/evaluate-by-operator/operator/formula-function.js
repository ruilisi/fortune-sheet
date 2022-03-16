/* eslint-disable import/no-named-as-default-member */
import SUPPORTED_FORMULAS from '../../../../src/supported-formulas';
import func from '../../../../src/evaluate-by-operator/operator/formula-function';

describe('formula function operator', () => {
  it('should set SYMBOL const', () => {
    expect(func.SYMBOL).toBe(SUPPORTED_FORMULAS);
  });

  it('should set isFactory const', () => {
    expect(func.isFactory).toBe(true);
  });

  it('should return error when formula not exist (shallow call)', () => {
    expect(() => func('SUMEE')(8.8, 2, 1, 4)).toThrow('NAME');
  });

  it('should return error when formula not exist (deep call)', () => {
    expect(() => func('SUMEE.INT')(8.8, 2, 1, 4)).toThrow('NAME');
  });

  it('should correctly process formula (shallow call)', () => {
    const result = func('SUM')(8.8, 2, 1, 4);

    expect(result).toBe(15.8);
  });

  it('should correctly process formula passed in lower case', () => {
    const result1 = func('Sum')(8.8, 2, 1, 4);
    const result2 = func('Rank.eq')(2, [7, 3.5, 3.5, 1, 2]);

    expect(result1).toBe(15.8);
    expect(result2).toBe(4);
  });
});
