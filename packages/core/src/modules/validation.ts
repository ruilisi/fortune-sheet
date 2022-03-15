export const error = {
  v: "#VALUE!", // 错误的参数或运算符
  n: "#NAME?", // 公式名称错误
  na: "#N/A", // 函数或公式中没有可用数值
  r: "#REF!", // 删除了由其他公式引用的单元格
  d: "#DIV/0!", // 除数是0或空单元格
  nm: "#NUM!", // 当公式或函数中某个数字有问题时
  nl: "#NULL!", // 交叉运算符（空格）使用不正确
  sp: "#SPILL!", // 数组范围有其它值
};

export function valueIsError(value: string) {
  for (const x in error) {
    if (value == error[x]) {
      return true;
    }
  }
  return false;
}
