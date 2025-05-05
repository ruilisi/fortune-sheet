import * as formulajs from "@mritunjaygoutam12/formulajs";
import SUPPORTED_FORMULAS from "./../../supported-formulas";
import { ERROR_NAME } from "./../../error";

export const SYMBOL = SUPPORTED_FORMULAS;

export default function func(symbol) {
  return function __formulaFunction(...params) {
    symbol = symbol.toUpperCase();

    const symbolParts = symbol.split(".");
    let foundFormula = false;
    let result;

    if (symbolParts.length === 1) {
      if (formulajs[symbolParts[0]]) {
        foundFormula = true;
        result = formulajs[symbolParts[0]](...params);
      }
    } else {
      const length = symbolParts.length;
      let index = 0;
      let nestedFormula = formulajs;

      while (index < length) {
        nestedFormula = nestedFormula[symbolParts[index]];
        index++;

        if (!nestedFormula) {
          nestedFormula = null;
          break;
        }
      }
      if (nestedFormula) {
        foundFormula = true;
        result = nestedFormula(...params);
      }
    }

    if (!foundFormula) {
      throw Error(ERROR_NAME);
    }

    return result;
  };
}

func.isFactory = true;
func.SYMBOL = SYMBOL;
