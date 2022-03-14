import React from "react";
import {
  isInlineStringCell,
  isInlineStringCT,
} from "@fortune-sheet/core/src/modules/inline-string";
import {
  getCellValue,
  normalizedCellAttr,
} from "@fortune-sheet/core/src/modules/cell";
import _ from "lodash";

export function getFontStyleByCell(
  cell: any,
  checksAF?: any[],
  checksCF?: any,
  isCheck = true
) {
  const style: React.CSSProperties = {};
  if (!cell) {
    return style;
  }
  Object.keys(cell).forEach((key) => {
    let value = cell[key];
    if (isCheck) {
      value = normalizedCellAttr(cell, key);
    }
    const valueNum = Number(value);
    if (key === "bl" && valueNum !== 0) {
      style.fontWeight = "bold";
    }

    if (key === "it" && valueNum !== 0) {
      style.fontStyle = "italic";
    }

    // if (key === "ff") {
    //   let f = value;
    //   if (!Number.isNaN(valueNum)) {
    //     f = locale_fontarray[parseInt(value)];
    //   } else {
    //     f = value;
    //   }
    //   style += "font-family: " + f + ";";
    // }

    if (key === "fs" && valueNum !== 10) {
      style.fontSize = valueNum;
    }

    if (
      (key === "fc" && value !== "#000000") ||
      (checksAF?.length ?? 0) > 0 ||
      checksCF?.textColor
    ) {
      if (checksCF?.textColor) {
        style.color = checksCF.textColor;
      } else if ((checksAF?.length ?? 0) > 0) {
        [style.color] = checksAF!;
      } else {
        style.color = value;
      }
    }

    if (key === "cl" && valueNum !== 0) {
      style.textDecoration = "line-through";
    }

    if (key === "un" && (valueNum === 1 || valueNum === 3)) {
      const color = cell._color ?? cell.fc;
      const fs = cell._fontSize ?? cell.fs;
      style.borderBottom = `${Math.floor(fs / 9)}px solid ${color}`;
    }
  });
  return style;
}

export function getStyleByCell(d: any, r: number, c: number) {
  let style: React.CSSProperties = {};

  // 交替颜色
  //   const af_compute = alternateformat.getComputeMap();
  //   const checksAF = alternateformat.checksAF(r, c, af_compute);
  const checksAF: any = [];

  // 条件格式
  //   const cf_compute = conditionformat.getComputeMap();
  //   const checksCF = conditionformat.checksCF(r, c, cf_compute);
  const checksCF: any = {};

  const cell = d[r][c];
  const isInline = isInlineStringCell(cell);
  if ("bg" in cell) {
    const value = normalizedCellAttr(cell, "bg");
    if (checksCF?.cellColor) {
      if (checksCF?.cellColor) {
        style.background = `${checksCF.cellColor}`;
      } else if (checksAF.length > 1) {
        style.background = `${checksAF[1]}`;
      } else {
        style.background = `${value}`;
      }
    }
  }
  if ("ht" in cell) {
    const value = normalizedCellAttr(cell, "ht");
    if (Number(value) === 0) {
      style.textAlign = "center";
    } else if (Number(value) === 2) {
      style.textAlign = "right";
    }
  }

  if ("vt" in cell) {
    const value = normalizedCellAttr(cell, "vt");
    if (Number(value) === 0) {
      style.alignItems = "center";
    } else if (Number(value) === 2) {
      style.alignItems = "flex-end";
    }
  }
  if (!isInline) {
    style = _.assign(style, getFontStyleByCell(cell, checksAF, checksCF));
  }

  return style;
}

export function getInlineStringHTML(r: number, c: number, data: any) {
  const ct = getCellValue(r, c, data, "ct");
  if (isInlineStringCT(ct)) {
    const strings = ct.s;
    let value = "";
    for (let i = 0; i < strings.length; i += 1) {
      const strObj = strings[i];
      if (strObj.v) {
        const style = getFontStyleByCell(strObj);
        const styleStr = _.map(style, (v, key) => {
          return `${_.kebabCase(key)}:${_.isNumber(v) ? `${v}px` : v};`;
        }).join("");
        value += `<span index='${i}' style='${styleStr}'>${strObj.v}</span>`;
      }
    }
    return value;
  }
  return "";
}
