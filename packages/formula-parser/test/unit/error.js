import error, {isValidStrict} from '../../src/error';

describe('.error()', () => {
  it('should return null for unrecognized error types', () => {
    expect(error()).toBe(null);
    expect(error('')).toBe(null);
    expect(error('dewdewdw')).toBe(null);
    expect(error('ERROR1')).toBe(null);
    expect(error(' ERROR!')).toBe(null);
    expect(error(' #ERROR!')).toBe(null);
  });

  it('should return `#ERROR!`', () => {
    expect(error('ERROR')).toBe('#ERROR!');
    expect(error('ERROR!')).toBe('#ERROR!');
    expect(error('#ERROR')).toBe('#ERROR!');
    expect(error('#ERROR!')).toBe('#ERROR!');
    expect(error('#ERROR?')).toBe('#ERROR!');
  });

  it('should return `#DIV/0!`', () => {
    expect(error('DIV/0')).toBe('#DIV/0!');
    expect(error('DIV/0!')).toBe('#DIV/0!');
    expect(error('#DIV/0')).toBe('#DIV/0!');
    expect(error('#DIV/0!')).toBe('#DIV/0!');
    expect(error('#DIV/0?')).toBe('#DIV/0!');
  });

  it('should return `#NAME?`', () => {
    expect(error('NAME')).toBe('#NAME?');
    expect(error('NAME!')).toBe('#NAME?');
    expect(error('#NAME')).toBe('#NAME?');
    expect(error('#NAME!')).toBe('#NAME?');
    expect(error('#NAME?')).toBe('#NAME?');
  });

  it('should return `#N/A`', () => {
    expect(error('N/A')).toBe('#N/A');
    expect(error('N/A!')).toBe('#N/A');
    expect(error('#N/A')).toBe('#N/A');
    expect(error('#N/A!')).toBe('#N/A');
    expect(error('#N/A?')).toBe('#N/A');
  });

  it('should return `#NULL!`', () => {
    expect(error('NULL')).toBe('#NULL!');
    expect(error('NULL!')).toBe('#NULL!');
    expect(error('#NULL')).toBe('#NULL!');
    expect(error('#NULL!')).toBe('#NULL!');
    expect(error('#NULL?')).toBe('#NULL!');
  });

  it('should return `#NUM!`', () => {
    expect(error('NUM')).toBe('#NUM!');
    expect(error('NUM!')).toBe('#NUM!');
    expect(error('#NUM')).toBe('#NUM!');
    expect(error('#NUM!')).toBe('#NUM!');
    expect(error('#NUM?')).toBe('#NUM!');
  });

  it('should return `#REF!`', () => {
    expect(error('REF')).toBe('#REF!');
    expect(error('REF!')).toBe('#REF!');
    expect(error('#REF')).toBe('#REF!');
    expect(error('#REF!')).toBe('#REF!');
    expect(error('#REF?')).toBe('#REF!');
  });

  it('should return `#VALUE?`', () => {
    expect(error('VALUE')).toBe('#VALUE!');
    expect(error('VALUE!')).toBe('#VALUE!');
    expect(error('#VALUE')).toBe('#VALUE!');
    expect(error('#VALUE!')).toBe('#VALUE!');
    expect(error('#VALUE?')).toBe('#VALUE!');
  });
});

describe('.isValidStrict()', () => {
  it('should return false for unrecognized error types', () => {
    expect(isValidStrict()).toBeFalsy();
    expect(isValidStrict('')).toBeFalsy();
    expect(isValidStrict('dewdewdw')).toBeFalsy();
    expect(isValidStrict('ERROR1')).toBeFalsy();
    expect(isValidStrict(' ERROR!')).toBeFalsy();
    expect(isValidStrict(' #ERROR!')).toBeFalsy();
  });

  it('should return true for valid general error (`#ERROR!`)', () => {
    expect(isValidStrict('#ERROR!')).toBeTruthy();
    expect(isValidStrict('ERROR')).toBeFalsy();
    expect(isValidStrict('ERROR!')).toBeFalsy();
    expect(isValidStrict('#ERROR')).toBeFalsy();
    expect(isValidStrict('#ERROR?')).toBeFalsy();
  });

  it('should return true for valid `#DIV/0!` error', () => {
    expect(isValidStrict('#DIV/0!')).toBeTruthy();
    expect(isValidStrict('DIV/0')).toBeFalsy();
    expect(isValidStrict('DIV/0!')).toBeFalsy();
    expect(isValidStrict('#DIV/0')).toBeFalsy();
    expect(isValidStrict('#DIV/0?')).toBeFalsy();
  });

  it('should return true for valid `#NAME?` error', () => {
    expect(isValidStrict('#NAME?')).toBeTruthy();
    expect(isValidStrict('NAME')).toBeFalsy();
    expect(isValidStrict('NAME!')).toBeFalsy();
    expect(isValidStrict('#NAME')).toBeFalsy();
    expect(isValidStrict('#NAME!')).toBeFalsy();
  });

  it('should return true for valid `#N/A` error', () => {
    expect(isValidStrict('#N/A')).toBeTruthy();
    expect(isValidStrict('N/A')).toBeFalsy();
    expect(isValidStrict('N/A!')).toBeFalsy();
    expect(isValidStrict('#N/A!')).toBeFalsy();
    expect(isValidStrict('#N/A?')).toBeFalsy();
  });

  it('should return true for valid `#NULL!` error', () => {
    expect(isValidStrict('#NULL!')).toBeTruthy();
    expect(isValidStrict('NULL')).toBeFalsy();
    expect(isValidStrict('NULL!')).toBeFalsy();
    expect(isValidStrict('#NULL')).toBeFalsy();
    expect(isValidStrict('#NULL?')).toBeFalsy();
  });

  it('should return true for valid `#NUM!` error', () => {
    expect(isValidStrict('#NUM!')).toBeTruthy();
    expect(isValidStrict('NUM')).toBeFalsy();
    expect(isValidStrict('NUM!')).toBeFalsy();
    expect(isValidStrict('#NUM')).toBeFalsy();
    expect(isValidStrict('#NUM?')).toBeFalsy();
  });

  it('should return true for valid `#REF!` error', () => {
    expect(isValidStrict('#REF!')).toBeTruthy();
    expect(isValidStrict('REF')).toBeFalsy();
    expect(isValidStrict('REF!')).toBeFalsy();
    expect(isValidStrict('#REF')).toBeFalsy();
    expect(isValidStrict('#REF?')).toBeFalsy();
  });

  it('should return true for valid `#VALUE!` error', () => {
    expect(isValidStrict('#VALUE!')).toBeTruthy();
    expect(isValidStrict('VALUE')).toBeFalsy();
    expect(isValidStrict('VALUE!')).toBeFalsy();
    expect(isValidStrict('#VALUE')).toBeFalsy();
    expect(isValidStrict('#VALUE?')).toBeFalsy();
  });
});
