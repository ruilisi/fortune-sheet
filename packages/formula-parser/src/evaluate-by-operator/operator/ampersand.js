export const SYMBOL = "&";

export default function func(...params) {
  return params.reduce((acc, value) => acc + value.toString(), "");
}

func.SYMBOL = SYMBOL;
