import _ from "lodash";
import { Context } from "../context";
import { Cell, CellMatrix, CellStyle } from "../types";
import { getCellValue, getFontStyleByCell } from "./cell";
import { selectTextContent, selectTextContentCross } from "./cursor";
import { escapeHTML } from "./format";

export const attrToCssName = {
  bl: "font-weight",
  it: "font-style",
  ff: "font-family",
  fs: "font-size",
  fc: "color",
  cl: "text-decoration",
  un: "border-bottom",
};

export const inlineStyleAffectAttribute = {
  bl: 1,
  it: 1,
  ff: 1,
  cl: 1,
  un: 1,
  fs: 1,
  fc: 1,
};

export const inlineStyleAffectCssName = {
  "font-weight": 1,
  "font-style": 1,
  "font-family": 1,
  "text-decoration": 1,
  "border-bottom": 1,
  "font-size": 1,
  color: 1,
};

export function isInlineStringCell(cell: any): boolean {
  return cell?.ct?.t === "inlineStr" && (cell?.ct?.s?.length ?? 0) > 0;
}

export function isInlineStringCT(ct: any): boolean {
  return ct?.t === "inlineStr" && (ct?.s?.length ?? 0) > 0;
}

export function getInlineStringNoStyle(r: number, c: number, data: CellMatrix) {
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
    value = escapeHTML(value);
    return value;
  }
  return "";
}

export function convertCssToStyleList(cssText: string) {
  if (_.isEmpty(cssText)) {
    return {};
  }
  const cssTextArray = cssText.split(";");

  const styleList: CellStyle = {
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
      styleList.cl = Number(value);
    }

    if (key === "lucky-underline") {
      styleList.un = Number(value);
    }
  });

  return styleList;
}

// eslint-disable-next-line no-undef
export function convertSpanToShareString($dom: NodeListOf<HTMLSpanElement>) {
  const styles: CellStyle[] = [];
  let preStyleList: Cell;
  let preStyleListString = null;
  for (let i = 0; i < $dom.length; i += 1) {
    const span = $dom[i];
    const styleList = convertCssToStyleList(span.style.cssText) as Cell;

    const curStyleListString = JSON.stringify(styleList);
    // let v = span.innerHTML;
    let v = span.innerText;
    v = v.replace(/\n/g, "\r\n");
    if (i === $dom.length - 1) {
      if (v.endsWith("\r\n") && !v.endsWith("\r\n\r\n")) {
        v = v.slice(0, v.length - 2);
      }
    }

    if (curStyleListString === preStyleListString) {
      preStyleList!.v += v;
    } else {
      styleList.v = v;
      styles.push(styleList);

      preStyleListString = curStyleListString;
      preStyleList = styleList;
    }
  }
  return styles;
}

export function updateInlineStringFormatOutside(
  cell: Cell,
  key: string,
  value: any
) {
  if (_.isNil(cell.ct)) {
    return;
  }
  const { s } = cell.ct;
  if (_.isNil(s)) {
    return;
  }
  for (let i = 0; i < s.length; i += 1) {
    const item = s[i];
    item[key] = value;
  }
}

function getClassWithcss(cssText: string, ukey: string) {
  const cssTextArray = cssText.split(";");
  if (ukey == null || ukey.length === 0) {
    return cssText;
  }
  if (cssText.indexOf(ukey) > -1) {
    for (let i = 0; i < cssTextArray.length; i += 1) {
      let s = cssTextArray[i];
      s = s.toLowerCase();
      const key = _.trim(s.substring(0, s.indexOf(":")));
      const value = _.trim(s.substring(s.indexOf(":") + 1));
      if (key === ukey) {
        return value;
      }
    }
  }

  return "";
}

function upsetClassWithCss(cssText: string, ukey: string, uvalue: any) {
  const cssTextArray = cssText.split(";");
  let newCss = "";
  if (ukey == null || ukey.length === 0) {
    return cssText;
  }
  if (cssText.indexOf(ukey) > -1) {
    for (let i = 0; i < cssTextArray.length; i += 1) {
      let s = cssTextArray[i];
      s = s.toLowerCase();
      const key = _.trim(s.substring(0, s.indexOf(":")));
      const value = _.trim(s.substring(s.indexOf(":") + 1));
      if (key === ukey) {
        newCss += `${key}:${uvalue};`;
      } else if (key.length > 0) {
        newCss += `${key}:${value};`;
      }
    }
  } else if (ukey.length > 0) {
    cssText += `${ukey}:${uvalue};`;
    newCss = cssText;
  }

  return newCss;
}

function removeClassWidthCss(cssText: string, ukey: string) {
  const cssTextArray = cssText.split(";");
  let newCss = "";
  const oUkey = ukey;
  if (ukey == null || ukey.length === 0) {
    return cssText;
  }
  if (ukey in attrToCssName) {
    // @ts-ignore
    ukey = attrToCssName[ukey];
  }
  if (cssText.indexOf(ukey) > -1) {
    for (let i = 0; i < cssTextArray.length; i += 1) {
      let s = cssTextArray[i];
      s = s.toLowerCase();
      const key = _.trim(s.substring(0, s.indexOf(":")));
      const value = _.trim(s.substring(s.indexOf(":") + 1));
      if (
        key === ukey ||
        (oUkey === "cl" && key === "lucky-strike") ||
        (oUkey === "un" && key === "lucky-underline")
      ) {
        continue;
      } else if (key.length > 0) {
        newCss += `${key}:${value};`;
      }
    }
  } else {
    newCss = cssText;
  }

  return newCss;
}

function getCssText(cssText: string, attr: keyof Cell, value: any) {
  const styleObj: any = {};
  styleObj[attr] = value;
  if (attr === "un") {
    let fontColor = getClassWithcss(cssText, "color");
    if (fontColor === "") {
      fontColor = "#000000";
    }
    let fs = getClassWithcss(cssText, "font-size");
    if (fs === "") {
      fs = "11";
    }
    styleObj._fontSize = Number(fs);
    styleObj._color = fontColor;
  }
  const s = getFontStyleByCell(styleObj, undefined, undefined, false);
  const ukey = _.kebabCase(Object.keys(s)[0]);
  const uvalue = Object.values(s)[0];
  // let cssText = span.style.cssText;
  cssText = removeClassWidthCss(cssText, attr);

  cssText = upsetClassWithCss(cssText, ukey, uvalue);

  return cssText;
}

function extendCssText(origin: string, cover: string, isLimit = true) {
  const originArray = origin.split(";");
  const coverArray = cover.split(";");
  let newCss = "";

  const addKeyList: any = {};
  for (let i = 0; i < originArray.length; i += 1) {
    let so = originArray[i];
    let isAdd = true;
    so = so.toLowerCase();
    const okey = _.trim(so.substring(0, so.indexOf(":")));

    /* 不设置文字的大小，解决设置删除线等后字体变大的问题 */
    if (okey === "font-size") {
      continue;
    }

    const ovalue = _.trim(so.substring(so.indexOf(":") + 1));

    if (isLimit) {
      if (!(okey in inlineStyleAffectCssName)) {
        continue;
      }
    }

    for (let a = 0; a < coverArray.length; a += 1) {
      let sc = coverArray[a];
      sc = sc.toLowerCase();
      const ckey = _.trim(sc.substring(0, sc.indexOf(":")));
      const cvalue = _.trim(sc.substring(sc.indexOf(":") + 1));

      if (okey === ckey) {
        newCss += `${ckey}:${cvalue};`;
        isAdd = false;
        continue;
      }
    }

    if (isAdd) {
      newCss += `${okey}:${ovalue};`;
    }

    addKeyList[okey] = 1;
  }

  for (let a = 0; a < coverArray.length; a += 1) {
    let sc = coverArray[a];
    sc = sc.toLowerCase();
    const ckey = _.trim(sc.substring(0, sc.indexOf(":")));
    const cvalue = _.trim(sc.substring(sc.indexOf(":") + 1));

    if (isLimit) {
      if (!(ckey in inlineStyleAffectCssName)) {
        continue;
      }
    }

    if (!(ckey in addKeyList)) {
      newCss += `${ckey}:${cvalue};`;
    }
  }

  return newCss;
}

export function updateInlineStringFormat(
  ctx: Context,
  cell: Cell,
  attr: keyof Cell,
  value: any,
  cellInput: HTMLDivElement
) {
  // let s = ctx.inlineStringEditCache;
  const w = window.getSelection();
  if (!w) return;

  const range = w.getRangeAt(0);

  const $textEditor = cellInput;

  if (range.collapsed === true) {
    return;
  }

  const { endContainer } = range;
  const { startContainer } = range;
  const { endOffset } = range;
  const { startOffset } = range;

  if ($textEditor) {
    if (startContainer === endContainer) {
      const span = startContainer.parentNode as HTMLElement | null;
      let spanIndex: number;
      let inherit = false;

      const content = span?.innerHTML || "";

      const fullContent = $textEditor.innerHTML;
      if (!fullContent.startsWith("<span")) {
        inherit = true;
      }

      if (span) {
        let left = "";
        let mid = "";
        let right = "";
        const s1 = 0;
        const s2 = startOffset;
        const s3 = endOffset;
        const s4 = content.length;
        left = content.substring(s1, s2);
        mid = content.substring(s2, s3);
        right = content.substring(s3, s4);

        let cont = "";
        if (left !== "") {
          let { cssText } = span.style;
          if (inherit) {
            const box = span.closest(
              "#luckysheet-input-box"
            ) as HTMLElement | null;
            if (box != null) {
              cssText = extendCssText(box.style.cssText, cssText);
            }
          }
          cont += `<span style='${cssText}'>${left}</span>`;
        }

        if (mid !== "") {
          let cssText = getCssText(span.style.cssText, attr, value);

          if (inherit) {
            const box = span.closest(
              "#luckysheet-input-box"
            ) as HTMLElement | null;
            if (box != null) {
              cssText = extendCssText(box.style.cssText, cssText);
            }
          }

          cont += `<span style='${cssText}'>${mid}</span>`;
        }

        if (right !== "") {
          let { cssText } = span.style;
          if (inherit) {
            const box = span.closest(
              "#luckysheet-input-box"
            ) as HTMLElement | null;
            if (box != null) {
              cssText = extendCssText(box.style.cssText, cssText);
            }
          }
          cont += `<span style='${cssText}'>${right}</span>`;
        }

        if (startContainer.parentElement?.tagName === "SPAN") {
          spanIndex = _.indexOf($textEditor.querySelectorAll("span"), span);
          span.outerHTML = cont;
        } else {
          spanIndex = 0;
          span.innerHTML = cont;
        }

        let seletedNodeIndex = 0;
        if (s1 === s2) {
          seletedNodeIndex = spanIndex;
        } else {
          seletedNodeIndex = spanIndex + 1;
        }

        selectTextContent(
          $textEditor.querySelectorAll("span")[seletedNodeIndex]
        );
      }
    } else {
      if (
        startContainer.parentElement?.tagName === "SPAN" &&
        endContainer.parentElement?.tagName === "SPAN"
      ) {
        const startSpan = startContainer.parentNode as HTMLElement | null;
        const endSpan = endContainer.parentNode as HTMLElement | null;
        const allSpans = $textEditor.querySelectorAll("span");

        const startSpanIndex = _.indexOf(allSpans, startSpan);
        const endSpanIndex = _.indexOf(allSpans, endSpan);

        const startContent = startSpan?.innerHTML || "";
        const endContent = endSpan?.innerHTML || "";
        let sleft = "";
        let sright = "";
        let eleft = "";
        let eright = "";
        const s1 = 0;
        const s2 = startOffset;
        const s3 = endOffset;
        const s4 = endContent.length;

        sleft = startContent.substring(s1, s2);
        sright = startContent.substring(s2, startContent.length);

        eleft = endContent.substring(0, s3);
        eright = endContent.substring(s3, s4);
        let spans = $textEditor.querySelectorAll("span");
        // const replaceSpans = spans.slice(startSpanIndex, endSpanIndex + 1);
        let cont = "";
        for (let i = 0; i < startSpanIndex; i += 1) {
          const span = spans[i];
          const content = span.innerHTML;
          cont += `<span style='${span.style.cssText}'>${content}</span>`;
        }
        if (sleft !== "") {
          cont += `<span style='${startSpan!.style.cssText}'>${sleft}</span>`;
        }

        if (sright !== "") {
          const cssText = getCssText(startSpan!.style.cssText, attr, value);
          cont += `<span style='${cssText}'>${sright}</span>`;
        }

        if (startSpanIndex < endSpanIndex) {
          for (let i = startSpanIndex + 1; i < endSpanIndex; i += 1) {
            const span = spans[i];
            const content = span.innerHTML;
            cont += `<span style='${span.style.cssText}'>${content}</span>`;
          }
        }

        if (eleft !== "") {
          const cssText = getCssText(endSpan!.style.cssText, attr, value);
          cont += `<span style='${cssText}'>${eleft}</span>`;
        }

        if (eright !== "") {
          cont += `<span style='${endSpan!.style.cssText}'>${eright}</span>`;
        }

        for (let i = endSpanIndex + 1; i < spans.length; i += 1) {
          const span = spans[i];
          const content = span.innerHTML;
          cont += `<span style='${span.style.cssText}'>${content}</span>`;
        }

        $textEditor.innerHTML = cont;

        // console.log(replaceSpans, cont);
        // replaceSpans.replaceWith(cont);

        let startSeletedNodeIndex;
        let endSeletedNodeIndex;
        if (s1 === s2) {
          startSeletedNodeIndex = startSpanIndex;
          endSeletedNodeIndex = endSpanIndex;
        } else {
          startSeletedNodeIndex = startSpanIndex + 1;
          endSeletedNodeIndex = endSpanIndex + 1;
        }

        spans = $textEditor.querySelectorAll("span");

        selectTextContentCross(
          spans[startSeletedNodeIndex],
          spans[endSeletedNodeIndex]
        );
      }
    }
  }
}
