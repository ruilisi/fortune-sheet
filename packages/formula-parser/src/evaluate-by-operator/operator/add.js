import {toNumber} from './../../helper/number';
import {ERROR_VALUE} from './../../error';

export const SYMBOL = '+';

export default function func(first, ...rest) {
  const result = rest.reduce((acc, value) => acc + toNumber(value || 0), toNumber(first || 0));

  if (isNaN(result)) {
    throw Error(ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;
