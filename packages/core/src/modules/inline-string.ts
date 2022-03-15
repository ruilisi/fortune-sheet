import _ from "lodash";
import { getCellValue } from "./cell";

export function isInlineStringCell(cell: any): boolean {
  return cell?.ct?.t === "inlineStr" && (cell?.ct?.s?.length ?? 0) > 0;
}

export function isInlineStringCT(ct: any): boolean {
  return ct?.t === "inlineStr" && (ct?.s?.length ?? 0) > 0;
}

export function getInlineStringNoStyle(r: number, c: number, data: any) {
  const ct = getCellValue(r, c, data, "ct");
  if (isInlineStringCT(ct)) {
    const strings = ct.s;
    let value = "";
    for (let i = 0; i < strings.length; i += 1) {
      const strObj = strings[i];
      if (strObj.v) {
        value += strObj.v;
      }
    }
    return value;
  }
  return "";
}

export function convertCssToStyleList(cssText: string) {
  if (_.isEmpty(cssText)) {
    return {};
  }
  const cssTextArray = cssText.split(";");

  const styleList = {
    // ff: locale_fontarray[0], // font family
    fc: "#000000", // font color
    fs: 10, // font size
    cl: 0, // strike
    un: 0, // underline
    bl: 0, // blod
    it: 0, // italic
  };
  cssTextArray.forEach((s) => {
    s = s.toLowerCase();
    const key = _.trim(s.substring(0, s.indexOf(":")));
    const value = _.trim(s.substring(s.indexOf(":") + 1));
    if (key === "font-weight") {
      if (value === "bold") {
        styleList.bl = 1;
      } else {
        styleList.bl = 0;
      }
    }

    if (key === "font-style") {
      if (value === "italic") {
        styleList.it = 1;
      } else {
        styleList.it = 0;
      }
    }

    // if (key === "font-family") {
    //   const ff = locale_fontjson[value];
    //   if (ff === null) {
    //     styleList.ff = value;
    //   } else {
    //     styleList.ff = ff;
    //   }
    // }

    if (key === "font-size") {
      styleList.fs = parseInt(value, 10);
    }

    if (key === "color") {
      styleList.fc = value;
    }

    if (key === "text-decoration") {
      styleList.cl = 1;
    }

    if (key === "border-bottom") {
      styleList.un = 1;
    }

    if (key === "lucky-strike") {
      styleList.cl = value;
    }

    if (key === "lucky-underline") {
      styleList.un = value;
    }
  });

  return styleList;
}

// eslint-disable-next-line no-undef
export function convertSpanToShareString($dom: NodeListOf<HTMLSpanElement>) {
  const styles = [];
  let preStyleList;
  let preStyleListString = null;
  for (let i = 0; i < $dom.length; i += 1) {
    const span = $dom[i];
    const styleList = convertCssToStyleList(span.style.cssText);

    const curStyleListString = JSON.stringify(styleList);
    // let v = span.innerHTML;
    let v = span.innerText;
    v = v.replace(/\n/g, "\r\n");

    if (curStyleListString === preStyleListString) {
      preStyleList.v += v;
    } else {
      styleList.v = v;
      styles.push(styleList);

      preStyleListString = curStyleListString;
      preStyleList = styleList;
    }
  }
  return styles;
}
