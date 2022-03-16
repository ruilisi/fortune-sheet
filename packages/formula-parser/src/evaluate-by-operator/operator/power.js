import {toNumber} from './../../helper/number';
import {ERROR_VALUE} from './../../error';

export const SYMBOL = '^';

export default function func(exp1, exp2) {
  const result = Math.pow(toNumber(exp1), toNumber(exp2));

  if (isNaN(result)) {
    throw Error(ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;
