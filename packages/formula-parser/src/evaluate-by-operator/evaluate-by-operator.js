/* eslint-disable import/no-named-as-default-member */
import add from "./operator/add";
import ampersand from "./operator/ampersand";
import divide from "./operator/divide";
import equal from "./operator/equal";
import formulaFunction from "./operator/formula-function";
import greaterThan from "./operator/greater-than";
import greaterThanOrEqual from "./operator/greater-than-or-equal";
import lessThan from "./operator/less-than";
import lessThanOrEqual from "./operator/less-than-or-equal";
import minus from "./operator/minus";
import multiply from "./operator/multiply";
import notEqual from "./operator/not-equal";
import power from "./operator/power";
import { ERROR_NAME } from "./../error";

const availableOperators = Object.create(null);

/**
 * Evaluate values by operator id.git
 *
 * @param {String} operator Operator id.
 * @param {Array} [params=[]] Arguments to evaluate.
 * @returns {*}
 */
export default function evaluateByOperator(operator, params = []) {
  operator = operator.toUpperCase();

  if (!availableOperators[operator]) {
    throw Error(ERROR_NAME);
  }

  return availableOperators[operator](...params);
}

/**
 * Register operator.
 *
 * @param {String|Array} symbol Symbol to register.
 * @param {Function} func Logic to register for this symbol.
 */
export function registerOperation(symbol, func) {
  if (!Array.isArray(symbol)) {
    symbol = [symbol.toUpperCase()];
  }
  symbol.forEach((s) => {
    if (func.isFactory) {
      availableOperators[s] = func(s);
    } else {
      availableOperators[s] = func;
    }
  });
}

registerOperation(add.SYMBOL, add);
registerOperation(ampersand.SYMBOL, ampersand);
registerOperation(divide.SYMBOL, divide);
registerOperation(equal.SYMBOL, equal);
registerOperation(power.SYMBOL, power);
registerOperation(formulaFunction.SYMBOL, formulaFunction);
registerOperation(greaterThan.SYMBOL, greaterThan);
registerOperation(greaterThanOrEqual.SYMBOL, greaterThanOrEqual);
registerOperation(lessThan.SYMBOL, lessThan);
registerOperation(lessThanOrEqual.SYMBOL, lessThanOrEqual);
registerOperation(multiply.SYMBOL, multiply);
registerOperation(notEqual.SYMBOL, notEqual);
registerOperation(minus.SYMBOL, minus);
