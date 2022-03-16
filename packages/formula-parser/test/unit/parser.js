import Parser from '../../src/parser';

describe('Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });
  afterEach(() => {
    parser = null;
  });

  describe('.parse()', () => {
    it('should be defined', () => {
      expect(parser.parse).toBeInstanceOf(Function);
    });

    it('should not internally call `parse` method of grammar parser object when an empty string was passed', () => {
      parser.parser.parse = jest.fn();

      parser.parse('');

      expect(parser.parser.parse).not.toHaveBeenCalled();
    });

    it('should return `#ERROR!` when parser throws unknown exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('some error');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#ERROR!', result: null});
    });

    it('should return `#ERROR!` when parser throws `#ERROR!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#ERROR!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#ERROR!', result: null});
    });

    it('should return `#DIV/0!` when parser throws `#DIV/0!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#DIV/0!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#DIV/0!', result: null});
    });

    it('should return `#NAME?` when parser throws `#NAME?` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#NAME?');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#NAME?', result: null});
    });

    it('should return `#N/A` when parser throws `#N/A` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#N/A');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#N/A', result: null});
    });

    it('should return `#NULL!` when parser throws `#NULL!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#NULL!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#NULL!', result: null});
    });

    it('should return `#NUM!` when parser throws `#NUM!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#NUM!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#NUM!', result: null});
    });

    it('should return `#REF!` when parser throws `#REF!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#REF!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#REF!', result: null});
    });

    it('should return `#VALUE!` when parser throws `#VALUE!` exception', () => {
      parser.parser.parse = jest.fn(() => {
        throw Error('#VALUE!');
      });

      expect(parser.parse('foo')).toMatchObject({error: '#VALUE!', result: null});
    });

    it('should not return `#ERROR!` when parser evaluate expression as `ERROR`', () => {
      parser.parser.parse = jest.fn(() => 'ERROR');

      expect(parser.parse('foo')).toMatchObject({error: null, result: 'ERROR'});
    });

    it('should not return `#ERROR!` when parser evaluate expression as `#ERROR!`', () => {
      parser.parser.parse = jest.fn(() => '#ERROR!');

      expect(parser.parse('foo')).toMatchObject({error: null, result: '#ERROR!'});
    });
  });

  describe('.setVariable()/.getVariable()', () => {
    it('should return default variables', () => {
      expect(parser.getVariable('TRUE')).toBe(true);
      expect(parser.getVariable('FALSE')).toBe(false);
      expect(parser.getVariable('NULL')).toBe(null);
      expect(parser.getVariable('foo')).not.toBeDefined();
    });

    it('should return custom variables', () => {
      parser.setVariable('foo', 1234);
      parser.setVariable('bar', '1234');
      parser.setVariable('baz', [1, 2]);

      expect(parser.getVariable('foo')).toBe(1234);
      expect(parser.getVariable('bar')).toBe('1234');
      expect(parser.getVariable('baz')).toMatchObject([1, 2]);
    });
  });

  describe('.setFunction()/.getFunction()', () => {
    it('should return custom functions', () => {
      parser.setFunction('foo', () => 1234);
      parser.setFunction('bar', (params) => params[0] + params[1]);

      expect(parser.getFunction('foo')()).toBe(1234);
      expect(parser.getFunction('bar')([1, 2])).toBe(3);
    });
  });

  describe('._callVariable()', () => {
    it('should return error (NAME) when variable not set', () => {
      parser.getVariable = jest.fn(() => void 0);

      expect(parser._callVariable.bind(parser)).toThrow(/NAME/);
    });

    it('should return variable when it was set', () => {
      parser.getVariable = jest.fn((name) => (name === 'bar' ? 'foo' : 'baz'));

      expect(parser._callVariable('bar')).toBe('foo');
      expect(parser._callVariable('barrr')).toBe('baz');
    });

    it('should return variable set by event emitter', () => {
      parser.getVariable = jest.fn(() => 'baz');

      parser.on('callVariable', (name, done) => {
        done(name === 'bar' ? 'foo' : void 0);
      });

      expect(parser._callVariable('bar')).toBe('foo');
      expect(parser._callVariable('barrr')).toBe('baz');
    });
  });

  describe('._callFunction()', () => {
    it('should return error (NAME) when function not set', () => {
      expect(() => parser._callFunction('NOT_DEFINED()')).toThrow(/NAME/);
    });

    it('should call predefined function', () => {
      parser.getFunction = jest.fn(() => void 0);

      expect(parser._callFunction('SUM', [1, 2])).toBe(3);
    });

    it('should call custom funciton when it was set', () => {
      parser.getFunction = jest.fn(() => (params) => params[0] + 1);

      expect(parser._callFunction('ADD_1', [2])).toBe(3);
    });

    it('should return variable set by event emitter', () => {
      parser.getFunction = jest.fn(() => (params) => params[0] + 1);

      parser.on('callFunction', (name, params, done) => {
        done(name === 'OVERRIDDEN' ? params[0] + 2 : void 0);
      });

      expect(parser._callFunction('ADD_1', [2])).toBe(3);
      expect(parser._callFunction('OVERRIDDEN', [2])).toBe(4);
    });
  });

  describe('._callCellValue()', () => {
    it('should return undefined if under specified coordinates data value not exist', () => {
      expect(parser._callCellValue('A1')).not.toBeDefined();
    });

    it('should return value under specified coordinates', () => {
      parser.on('callCellValue', (cell, done) => {
        const {row, column} = cell;
        let value;

        if (row.index === 0 && column.index === 2) {
          value = '4';
        } else if (row.index === 0 && column.index === 7) {
          value = 45;
        } else if (row.index === 2 && column.index === 7) {
          value = [1, 2, 3];
        } else if (row.index === 3 && column.index === 7 && column.isAbsolute) {
          value = true;
        } else if (row.index === 4 && row.isAbsolute && column.index === 7 && column.isAbsolute) {
          value = 0.9;
        }

        done(value);
      });

      expect(parser._callCellValue('A1')).toBe(void 0);
      expect(parser._callCellValue('C1')).toBe('4');
      expect(parser._callCellValue('H1')).toBe(45);
      expect(parser._callCellValue('H3')).toMatchObject([1, 2, 3]);
      expect(parser._callCellValue('$H4')).toBe(true);
      expect(parser._callCellValue('$H$5')).toBe(0.9);
    });
  });

  describe('._callRangeValue()', () => {
    it('should return an empty array if under specified coordinates data value not exist', () => {
      expect(parser._callRangeValue('A1', 'B2')).toMatchObject([]);
    });

    it('should return value under specified coordinates', () => {
      parser.on('callRangeValue', (firstCell, lastCell, done) => {
        const {row: row1, column: column1} = firstCell;
        const {row: row2, column: column2} = lastCell;
        let value;

        if (row1.index === 0 && column1.index === 2 && row2.index === 3 && column2.index === 3) {
          value = [[1, 2], [4, 5]];
        } else if (row1.index === 0 && row1.isAbsolute && column1.index === 0 &&
                   row2.index === 3 && column2.index === 3 && column2.isAbsolute) {
          value = [['a', 'b'], ['z', 'd']];
        } else if (row1.index === 0 && row1.isAbsolute && column1.index === 0 && column1.isAbsolute &&
                   row2.index === 4 && row2.isAbsolute && column2.index === 4 && column2.isAbsolute) {
          value = [[true, false], [true, true]];

        } else if (row1.index === 4 && row1.isAbsolute && column1.index === 7 && column1.isAbsolute) {
          value = 0.9;
        }

        done(value);
      });

      expect(parser._callRangeValue('C1', 'D4')).toMatchObject([[1, 2], [4, 5]]);
      expect(parser._callRangeValue('A$1', '$D4')).toMatchObject([['a', 'b'], ['z', 'd']]);
      expect(parser._callRangeValue('$A$1', '$E$5')).toMatchObject([[true, false], [true, true]]);
    });

    it('should convert coordinates in top-left bottom-right format (from bottom-left to top-right)', () => {
      const cb = jest.fn();

      parser.on('callRangeValue', cb);
      parser._callRangeValue('$A$9', 'B2');

      const startCell = {
        row: {index: 1, isAbsolute: false, label: '2'},
        column: {index: 0, isAbsolute: true, label: 'A'},
        label: '$A2',
      };
      const endCell = {
        row: {index: 8, isAbsolute: true, label: '9'},
        column: {index: 1, isAbsolute: false, label: 'B'},
        label: 'B$9',
      };

      expect(cb).toHaveBeenCalledWith(startCell, endCell, expect.anything());
    });

    it('should convert coordinates in top-left bottom-right format (from top-right to bottom-left)', () => {
      const cb = jest.fn();

      parser.on('callRangeValue', cb);
      parser._callRangeValue('B$2', 'A$8');

      const startCell = {
        row: {index: 1, isAbsolute: true, label: '2'},
        column: {index: 0, isAbsolute: false, label: 'A'},
        label: 'A$2',
      };
      const endCell = {
        row: {index: 7, isAbsolute: true, label: '8'},
        column: {index: 1, isAbsolute: false, label: 'B'},
        label: 'B$8',
      };

      expect(cb).toHaveBeenCalledWith(startCell, endCell, expect.anything());
    });
  });

  describe('._throwError()', () => {
    it('should throw general error', () => {
      expect(() => parser._throwError('#ERROR!')).toThrow('ERROR');
    });

    it('should throw dividing by 0 error', () => {
      expect(() => parser._throwError('#DIV/0!')).toThrow('DIV/0');
    });

    it('should throw name error', () => {
      expect(() => parser._throwError('#NAME?')).toThrow('NAME');
    });

    it('should throw not available error', () => {
      expect(() => parser._throwError('#N/A')).toThrow('N/A');
    });

    it('should throw null error', () => {
      expect(() => parser._throwError('#NULL!')).toThrow('NULL');
    });

    it('should throw num error', () => {
      expect(() => parser._throwError('#NUM!')).toThrow('NUM');
    });

    it('should throw ref error', () => {
      expect(() => parser._throwError('#REF!')).toThrow('REF');
    });

    it('should throw value error', () => {
      expect(() => parser._throwError('#VALUE!')).toThrow('VALUE');
    });

    it('should return general error if value not matches to any of known errors', () => {
      expect(() => parser._throwError('VALUE foo')).toThrow('ERROR');
    });
  });
});
