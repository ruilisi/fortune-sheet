// import jest from 'jest';

function tolerance(precision) {
  if (precision === void 0 || precision === null) {
    precision = 7;
  }

  return 0.5 * Math.pow(10, -precision);
}

jest.addMatchers({
  toBeMatchCloseTo() {
    return {
      compare(actual, expected, precision) {
        let pass = false;

        Object.keys(actual).forEach((key) => {
          const a = actual[key];
          const e = expected[key];

          if (a === e || isNaN(a) === isNaN(e)) {
            pass = true;

          } else if (typeof a === 'number' && typeof e === 'number' && Math.abs(a - e) < tolerance(precision)) {
            pass = true;

          } else {
            pass = false;
          }
        });

        return {
          message: `Expected ${actual} to be closly equal value to ${expected}`,
          pass,
        };
      },
    };
  },
});
