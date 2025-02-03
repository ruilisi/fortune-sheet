import { toNumber } from "./../../helper/number";
import { ERROR_DIV_ZERO, ERROR_VALUE } from "./../../error";

export const SYMBOL = "/";

export default function func(first, ...rest) {
  const result = rest.reduce(
    (acc, value) => acc / toNumber(value),
    toNumber(first)
  );

  if (result === Infinity) {
    return ERROR_DIV_ZERO;
    // throw Error(ERROR_DIV_ZERO);
  }
  if (isNaN(result)) {
    return ERROR_VALUE;
    // throw Error(ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;
