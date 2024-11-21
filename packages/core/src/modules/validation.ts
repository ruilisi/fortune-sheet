import dayjs from "dayjs";
import _ from "lodash";
import { Context } from "../context";
import { hasChinaword } from "./text";

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

const errorValues = Object.values(error);

export function valueIsError(value: string) {
  return errorValues.includes(value);
}

// 是否是空值
export function isRealNull(val: any) {
  return _.isNil(val) || val.toString().replace(/\s/g, "") === "";
}

// 是否是纯数字
export function isRealNum(val: any) {
  if (_.isNil(val) || val.toString().replace(/\s/g, "") === "") {
    return false;
  }

  if (typeof val === "boolean") {
    return false;
  }

  return !Number.isNaN(Number(val));
}

function checkDateTime(str: string, format: string) {
  const reg1 =
    format === "24"
      ? /^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/
      : /^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?\s?(AM|PM)?$/;
  const reg2 =
    format === "24"
      ? /^(\d{4})\/(\d{1,2})\/(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/
      : /^(\d{4})\/(\d{1,2})\/(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?\s?(AM|PM)?$/;

  if (!reg1.test(str) && !reg2.test(str)) {
    return false;
  }

  const year = Number(RegExp.$1);
  const month = Number(RegExp.$2);
  const day = Number(RegExp.$3);

  if (year < 1900) {
    return false;
  }

  if (month > 12) {
    return false;
  }

  if (day > 31) {
    return false;
  }

  if (month === 2) {
    if (new Date(year, 1, 29).getDate() === 29 && day > 29) {
      return false;
    }
    if (new Date(year, 1, 29).getDate() !== 29 && day > 28) {
      return false;
    }
  }
  return true;
}

export function isdatetime(s: any, format: string = "24") {
  if (s === null || s.toString().length < 5) {
    return false;
  }
  if (checkDateTime(s, format)) {
    return true;
  }
  return false;
}

export function diff(now: any, then: any) {
  return dayjs(now).diff(dayjs(then));
}

export function isdatatypemulti(s: any) {
  const type: any = {};

  if (isdatetime(s)) {
    type.date = true;
  }

  if (!Number.isNaN(parseFloat(s)) && !hasChinaword(s)) {
    type.num = true;
  }

  return type;
}

export function isdatatype(s: any) {
  let type = "string";

  if (isdatetime(s)) {
    type = "date";
  } else if (!Number.isNaN(parseFloat(s)) && !hasChinaword(s)) {
    type = "num";
  }

  return type;
}

// 范围是否只包含部分合并单元格
export function hasPartMC(
  ctx: Context,
  cfg: any,
  r1: number,
  r2: number,
  c1: number,
  c2: number
) {
  let ret = false;

  _.forEach(ctx.config.merge, (mc) => {
    if (r1 < mc.r) {
      if (r2 >= mc.r && r2 < mc.r + mc.rs - 1) {
        if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 >= mc.r && r2 === mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 > mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 > mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      }
    } else if (r1 === mc.r) {
      if (r2 < mc.r + mc.rs - 1) {
        if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      } else if (r2 >= mc.r + mc.rs - 1) {
        if (c1 > mc.c && c1 <= mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c2 >= mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 === mc.c && c2 < mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
        if (c1 > mc.c && c2 === mc.c + mc.cs - 1) {
          ret = true;
          return false;
        }
      }
    } else if (r1 <= mc.r + mc.rs - 1) {
      if (c1 >= mc.c && c1 <= mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
      if (c2 >= mc.c && c2 <= mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
      if (c1 < mc.c && c2 > mc.c + mc.cs - 1) {
        ret = true;
        return false;
      }
    }
    return true;
  });

  return ret;
}
