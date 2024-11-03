import _ from "lodash";
import { isdatatypemulti } from ".";
import type { Context } from "../context";
import { locale } from "../locale";
import { Cell } from "../types";
import { normalizedCellAttr } from "./cell";
import { isInlineStringCell } from "./inline-string";

function checkWordByteLength(value: string) {
  return Math.ceil(value.charCodeAt(0).toString(2).length / 8);
}

export function hasChinaword(s: string) {
  const patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;

  if (!patrn.exec(s)) {
    return false;
  }
  return true;
}

const textHeightCache: any = {};
let measureTextCache: any = {};
let measureTextCellInfoCache: any = {};

export function clearMeasureTextCache() {
  measureTextCache = {};
  measureTextCellInfoCache = {};
}

function getTextSize(text: string, font: string) {
  if (font in textHeightCache) {
    return textHeightCache[font];
  }

  const ele = document.createElement("span");
  ele.style.float = "left";
  ele.style.whiteSpace = "nowrap";
  ele.style.visibility = "hidden";
  ele.style.margin = "0";
  ele.style.padding = "0";
  ele.innerHTML = text;
  document.body.append(ele);

  const w = Math.max(ele.scrollWidth, ele.offsetWidth, ele.clientWidth);
  const h = Math.max(ele.scrollHeight, ele.offsetHeight, ele.clientHeight);

  textHeightCache[font] = [w, h];

  ele.remove();
  return [w, h];
}

export function defaultFont(defaultFontSize: number) {
  return `normal normal normal ${defaultFontSize}pt "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Heiti SC",  "WenQuanYi Micro Hei", sans-serif`;
}

export function getFontSet(
  format: any,
  defaultFontSize: number,
  ctx?: Context
) {
  if (_.isPlainObject(format)) {
    const fontAttr: string[] = [];

    // font-style
    if (format.it === "0" || format.it === 0 || _.isNil(format.it)) {
      fontAttr.push("normal");
    } else {
      fontAttr.push("italic");
    }

    // font-variant
    fontAttr.push("normal");

    // font-weight
    if (format.bl === "0" || format.bl === 0 || _.isNil(format.bl)) {
      fontAttr.push("normal");
    } else {
      fontAttr.push("bold");
    }

    // font-size/line-height
    if (!format.fs) {
      fontAttr.push(`${defaultFontSize}pt`);
    } else {
      fontAttr.push(`${Math.ceil(format.fs)}pt`);
    }

    let fontSet = `"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    if (ctx) {
      const { fontarray } = locale(ctx);
      if (!format.ff) {
        fontSet = `${fontarray[0]},${fontSet}`;
      } else {
        let fontfamily = null;
        if (ctx) {
          if (isdatatypemulti(format.ff).num) {
            fontfamily = fontarray[parseInt(format.ff, 10)];
          } else {
            // fontfamily = fontarray[fontjson[format.ff]];
            fontfamily = format.ff;

            fontfamily = fontfamily.replace(/"/g, "").replace(/'/g, "");

            if (fontfamily.indexOf(" ") > -1) {
              fontfamily = `"${fontfamily}"`;
            }

            // if (
            //   fontfamily != null &&
            //   document.fonts &&
            //   !document.fonts.check(`12px ${fontfamily}`)
            // ) {
            //   menuButton.addFontTolist(fontfamily);
            // }
          }

          // if (fontfamily == null) {
          //   fontfamily = fontarray[0];
          // }
        }

        fontSet = `${fontfamily},${fontSet}`;
      }
    }
    return `${fontAttr.join(" ")} ${fontSet}`;
  }
  return defaultFont(defaultFontSize);
}

// 获取有值单元格文本大小
// let measureTextCache = {}, measureTextCacheTimeOut = null;
export function getMeasureText(
  value: any,
  renderCtx: CanvasRenderingContext2D,
  sheetCtx: Context,
  fontset?: string
) {
  let mtc = measureTextCache[`${value}_${renderCtx.font}`];
  if (fontset) {
    mtc = measureTextCache[`${value}_${fontset}`];
  }

  if (mtc != null) {
    return mtc;
  }
  if (fontset) {
    renderCtx.font = fontset;
  }

  const measureText = renderCtx.measureText(value);
  const cache: any = {};
  // var regu = "^[ ]+$";
  // var re = new RegExp(regu);
  // if(measureText.actualBoundingBoxRight==null || re.test(value)){
  //     cache.width = measureText.width;
  // }
  // else{
  //     //measureText.actualBoundingBoxLeft +
  //     cache.width = measureText.actualBoundingBoxRight;
  // }

  cache.width = measureText.width;

  if (fontset) {
    renderCtx.font = fontset;
  }

  cache.actualBoundingBoxDescent = measureText.actualBoundingBoxDescent;
  cache.actualBoundingBoxAscent = measureText.actualBoundingBoxAscent;
  if (
    cache.actualBoundingBoxDescent == null ||
    cache.actualBoundingBoxAscent == null ||
    Number.isNaN(cache.actualBoundingBoxDescent) ||
    Number.isNaN(cache.actualBoundingBoxAscent)
  ) {
    let commonWord = "M";
    if (hasChinaword(value)) {
      commonWord = "田";
    }
    const oneLineTextHeight = getTextSize(commonWord, renderCtx.font)[1] * 0.8;
    if (renderCtx.textBaseline === "top") {
      cache.actualBoundingBoxDescent = oneLineTextHeight;
      cache.actualBoundingBoxAscent = 0;
    } else if (renderCtx.textBaseline === "middle") {
      cache.actualBoundingBoxDescent = oneLineTextHeight / 2;
      cache.actualBoundingBoxAscent = oneLineTextHeight / 2;
    } else {
      cache.actualBoundingBoxDescent = 0;
      cache.actualBoundingBoxAscent = oneLineTextHeight;
    }

    // console.log(value, oneLineTextHeight, measureText.actualBoundingBoxDescent+measureText.actualBoundingBoxAscent,ctx.font);
  }

  if (renderCtx.textBaseline === "alphabetic") {
    const descText = "gjpqy";
    const matchText = "abcdABCD";
    let descTextMeasure = measureTextCache[`${descText}_${renderCtx.font}`];
    if (fontset) {
      descTextMeasure = measureTextCache[`${descText}_${fontset}`];
    }

    let matchTextMeasure = measureTextCache[`${matchText}_${renderCtx.font}`];
    if (fontset) {
      matchTextMeasure = measureTextCache[`${matchText}_${fontset}`];
    }

    if (descTextMeasure == null) {
      descTextMeasure = renderCtx.measureText(descText);
    }

    if (matchTextMeasure == null) {
      matchTextMeasure = renderCtx.measureText(matchText);
    }

    if (
      cache.actualBoundingBoxDescent <=
      matchTextMeasure.actualBoundingBoxDescent
    ) {
      cache.actualBoundingBoxDescent = descTextMeasure.actualBoundingBoxDescent;
      if (!cache.actualBoundingBoxDescent) {
        cache.actualBoundingBoxDescent = 0;
      }
    }
  }

  cache.width *= sheetCtx.zoomRatio;
  cache.actualBoundingBoxDescent *= sheetCtx.zoomRatio;
  cache.actualBoundingBoxAscent *= sheetCtx.zoomRatio;
  measureTextCache[`${value}_${sheetCtx.zoomRatio}_${renderCtx.font}`] = cache;
  // console.log(measureText, value);
  return cache;
}

export function isSupportBoundingBox(ctx: CanvasRenderingContext2D) {
  const measureText = ctx.measureText("田");
  if (_.isNil(measureText.actualBoundingBoxAscent)) {
    return false;
  }
  return true;
}

export function drawLineInfo(
  wordGroup: any,
  cancelLine: string,
  underLine: string,
  option: any
) {
  const { left } = option;
  const { top } = option;
  const { width } = option;
  const { asc } = option;
  const { desc } = option;
  const { fs } = option;

  if (wordGroup.wrap === true) {
    return;
  }

  if (wordGroup.inline === true && !_.isNil(wordGroup.style)) {
    cancelLine = wordGroup.style.cl;
    underLine = wordGroup.style.un;
  }

  if (Number(cancelLine) !== 0) {
    wordGroup.cancelLine = {};
    wordGroup.cancelLine.startX = left;
    wordGroup.cancelLine.startY = top - asc / 2 + 1;

    wordGroup.cancelLine.endX = left + width;
    wordGroup.cancelLine.endY = top - asc / 2 + 1;

    wordGroup.cancelLine.fs = fs;
  }

  const nUnderline = Number(underLine);
  if (nUnderline !== 0) {
    wordGroup.underLine = [];
    if (nUnderline === 1 || nUnderline === 2) {
      const item: any = {};
      item.startX = left;
      item.startY = top + 3;

      item.endX = left + width;
      item.endY = top + 3;

      item.fs = fs;

      wordGroup.underLine.push(item);
    }

    if (nUnderline === 2) {
      const item: any = {};
      item.startX = left;
      item.startY = top + desc;

      item.endX = left + width;
      item.endY = top + desc;

      item.fs = fs;

      wordGroup.underLine.push(item);
    }

    if (nUnderline === 3 || nUnderline === 4) {
      const item: any = {};
      item.startX = left;
      item.startY = top + desc;

      item.endX = left + width;
      item.endY = top + desc;

      item.fs = fs;

      wordGroup.underLine.push(item);
    }

    if (nUnderline === 4) {
      const item: any = {};
      item.startX = left;
      item.startY = top + desc + 2;

      item.endX = left + width;
      item.endY = top + desc + 2;

      item.fs = fs;

      wordGroup.underLine.push(item);
    }
  }
}

// 获取单元格文本内容的渲染信息
// let measureTextCache = {}, measureTextCacheTimeOut = null;
// option {cellWidth,cellHeight,space_width,space_height}
export function getCellTextInfo(
  cell: Cell,
  renderCtx: CanvasRenderingContext2D,
  sheetCtx: Context,
  option: any,
  ctx?: Context
): any {
  const { cellWidth } = option;
  const { cellHeight } = option;
  let isMode = "";
  let isModeSplit = "";
  // console.log("initialinfo", cell, option);
  if (cellWidth == null) {
    isMode = "onlyWidth";
    isModeSplit = "_";
  }
  const textInfo =
    measureTextCellInfoCache[`${option.r}_${option.c}${isModeSplit}${isMode}`];
  if (textInfo) {
    return textInfo;
  }

  // let cell = sheetCtx.flowdata[r][c];
  let { space_width } = option;
  let { space_height } = option; // 宽高方向 间隙

  if (space_width === undefined) {
    space_width = 2;
  }

  if (space_height === undefined) {
    space_height = 2;
  }

  // 水平对齐
  const horizonAlign = normalizedCellAttr(cell, "ht");
  // 垂直对齐
  const verticalAlign = normalizedCellAttr(cell, "vt");

  const tb = normalizedCellAttr(cell, "tb"); // wrap overflow
  const tr = normalizedCellAttr(cell, "tr"); // rotate
  let rt = normalizedCellAttr(cell, "rt"); // rotate angle

  let isRotateUp = 1;

  if (_.isNil(rt)) {
    if (tr === "0") {
      rt = 0;
    } else if (tr === "1") {
      rt = 45;
    } else if (tr === "4") {
      rt = 90;
    } else if (tr === "2") {
      rt = 135;
    } else if (tr === "5") {
      rt = 180;
    }

    if (_.isNil(rt)) {
      rt = 0;
    }
  }

  if (rt > 180 || rt < 0) {
    rt = 0;
  }

  rt = parseInt(rt, 10);
  if (rt > 90) {
    rt = 90 - rt;
    isRotateUp = 0;
  }

  renderCtx.textAlign = "start";

  const textContent: any = {};
  textContent.values = [];

  let fontset;
  let cancelLine = "0";
  let underLine = "0";
  let fontSize = 11;
  let isInline = false;
  let value: any;
  const inlineStringArr: {
    fontset: string;
    fc: string;
    cl: number;
    un: number;
    wrap?: boolean;
    fs: number;
    v?: any;
    si?: number;
    measureText?: any;
  }[] = [];
  if (isInlineStringCell(cell)) {
    const sharedStrings = cell.ct!.s;
    let similarIndex = 0;
    for (let i = 0; i < sharedStrings.length; i += 1) {
      const shareCell = sharedStrings[i];
      const scfontset = getFontSet(shareCell, sheetCtx.defaultFontSize, ctx);
      const { fc } = shareCell;
      const { cl } = shareCell;
      const { un } = shareCell;
      let { v } = shareCell;
      const { fs } = shareCell;
      v = v
        .replace(/\r\n/g, "_x000D_")
        .replace(/&#13;&#10;/g, "_x000D_")
        .replace(/\r/g, "_x000D_")
        .replace(/\n/g, "_x000D_");
      const splitArr = v.split("_x000D_");
      for (let x = 0; x < splitArr.length; x += 1) {
        const newValue = splitArr[x];

        // incase the value is empty
        // if (newValue === "" && splitArr.length === 1) {
        //   inlineStringArr.push({
        //     fontset: scfontset,
        //     fc: !fc ? "#000" : fc,
        //     cl: !cl ? 0 : cl,
        //     un: !un ? 0 : un,
        //     v: "",
        //     si: similarIndex,
        //     fs: !fs ? 11 : fs,
        //   });
        // } else
        if (newValue === "" && x !== splitArr.length - 1) {
          inlineStringArr.push({
            fontset: scfontset,
            fc: !fc ? "#000" : fc,
            cl: !cl ? 0 : cl,
            un: !un ? 0 : un,
            wrap: true,
            fs: !fs ? 11 : fs,
          });
          similarIndex += 1;
        } else {
          inlineStringArr.push({
            fontset: scfontset,
            fc: !fc ? "#000" : fc,
            cl: !cl ? 0 : cl,
            un: !un ? 0 : un,
            v: newValue,
            si: similarIndex,
            fs: !fs ? 11 : fs,
          });

          if (x !== splitArr.length - 1) {
            inlineStringArr.push({
              fontset: scfontset,
              fc: !fc ? "#000" : fc,
              cl: !cl ? 0 : cl,
              un: !un ? 0 : un,
              wrap: true,
              fs: !fs ? 11 : fs,
            });
            similarIndex += 1;
          }
        }
      }

      similarIndex += 1;
    }
    isInline = true;
  } else {
    fontset = getFontSet(cell, sheetCtx.defaultFontSize, ctx);
    renderCtx.font = fontset;

    cancelLine = normalizedCellAttr(cell, "cl"); // cancelLine
    underLine = normalizedCellAttr(cell, "un"); // underLine
    fontSize = normalizedCellAttr(cell, "fs");

    if (cell instanceof Object) {
      value = cell.m;
      if (_.isNil(value)) {
        value = cell.v;
      }
    } else {
      value = cell;
    }

    if (_.isEmpty(value)) {
      return null;
    }
  }

  if (tr === "3") {
    // vertical text
    renderCtx.textBaseline = "top";

    let textW_all = 0; // 拆分后宽高度合计
    let textH_all = 0;
    let colIndex = 0;
    let textH_all_cache = 0;
    const textH_all_Column: any = {};
    const textH_all_ColumnHeight = [];
    if (isInline) {
      let preShareCell = null;
      for (let i = 0; i < inlineStringArr.length; i += 1) {
        const shareCell = inlineStringArr[i];
        let value1 = shareCell.v;
        let showValue = shareCell.v;
        if (shareCell.wrap === true) {
          value1 = "M";
          showValue = "";

          if (
            !_.isNil(preShareCell) &&
            preShareCell.wrap !== true &&
            i < inlineStringArr.length - 1
          ) {
            // console.log("wrap",i,colIndex,preShareCell.wrap);
            textH_all_ColumnHeight.push(textH_all_cache);
            textH_all_cache = 0;
            colIndex += 1;

            preShareCell = shareCell;
            continue;
          }
        }

        const measureText = getMeasureText(
          value1,
          renderCtx,
          sheetCtx,
          shareCell.fontset
        );

        const textW = measureText.width + space_width;
        const textH =
          measureText.actualBoundingBoxAscent +
          measureText.actualBoundingBoxDescent +
          space_height;

        // textW_all += textW;
        textH_all_cache += textH;

        if (tb === "2" && !shareCell.wrap) {
          if (
            textH_all_cache > cellHeight &&
            !_.isNil(textH_all_Column[colIndex])
          ) {
            // textW_all += textW;
            // textH_all = Math.max(textH_all,textH_all_cache);
            // console.log(">",i,colIndex);
            textH_all_ColumnHeight.push(textH_all_cache - textH);
            textH_all_cache = textH;
            colIndex += 1;
          }
        }

        if (i === inlineStringArr.length - 1) {
          textH_all_ColumnHeight.push(textH_all_cache);
        }

        if (_.isNil(textH_all_Column[colIndex])) {
          textH_all_Column[colIndex] = [];
        }

        const item = {
          content: showValue,
          style: shareCell,
          width: textW,
          height: textH,
          left: 0,
          top: 0,
          colIndex,
          asc: measureText.actualBoundingBoxAscent,
          desc: measureText.actualBoundingBoxDescent,
          inline: true,
          wrap: false,
        };

        if (shareCell.wrap === true) {
          item.wrap = true;
        }

        textH_all_Column[colIndex].push(item);
        preShareCell = shareCell;
      }
    } else {
      const measureText = getMeasureText(value, renderCtx, sheetCtx);
      const textHeight =
        measureText.actualBoundingBoxDescent +
        measureText.actualBoundingBoxAscent;

      value = value.toString();

      let vArr = [];
      if (value.length > 1) {
        vArr = value.split("");
      } else {
        vArr.push(value);
      }
      const oneWordWidth = getMeasureText(vArr[0], renderCtx, sheetCtx).width;

      for (let i = 0; i < vArr.length; i += 1) {
        const textW = oneWordWidth + space_width;
        const textH = textHeight + space_height;

        // textW_all += textW;
        textH_all_cache += textH;

        if (tb === "2") {
          if (
            textH_all_cache > cellHeight &&
            !_.isNil(textH_all_Column[colIndex])
          ) {
            // textW_all += textW;
            // textH_all = Math.max(textH_all,textH_all_cache);
            textH_all_ColumnHeight.push(textH_all_cache - textH);
            textH_all_cache = textH;
            colIndex += 1;
          }
        }

        if (i === vArr.length - 1) {
          textH_all_ColumnHeight.push(textH_all_cache);
        }

        if (_.isNil(textH_all_Column[colIndex])) {
          textH_all_Column[colIndex] = [];
        }

        textH_all_Column[colIndex].push({
          content: vArr[i],
          style: fontset,
          width: textW,
          height: textH,
          left: 0,
          top: 0,
          colIndex,
          asc: measureText.actualBoundingBoxAscent,
          desc: measureText.actualBoundingBoxDescent,
        });
      }
    }

    const textH_all_ColumWidth = [];
    for (let i = 0; i < textH_all_ColumnHeight.length; i += 1) {
      const columnHeight = textH_all_ColumnHeight[i];
      const col = textH_all_Column[i];
      let colMaxW = 0;
      for (let c = 0; c < col.length; c += 1) {
        const word = col[c];
        colMaxW = Math.max(colMaxW, word.width);
      }
      textH_all_ColumWidth.push(colMaxW);
      textW_all += colMaxW;
      textH_all = Math.max(textH_all, columnHeight);
    }

    textContent.type = "verticalWrap";
    textContent.textWidthAll = textW_all;
    textContent.textHeightAll = textH_all;

    if (isMode === "onlyWidth") {
      // console.log("verticalWrap", textContent,cell, option);
      return textContent;
    }

    let cumColumnWidth = 0;
    for (let i = 0; i < textH_all_ColumnHeight.length; i += 1) {
      const columnHeight = textH_all_ColumnHeight[i];
      const columnWidth = textH_all_ColumWidth[i];

      const col = textH_all_Column[i];
      let cumWordHeight = 0;
      for (let c = 0; c < col.length; c += 1) {
        const word = col[c];

        let left = space_width + cumColumnWidth;
        if (horizonAlign === "0") {
          left =
            cellWidth / 2 +
            cumColumnWidth -
            textW_all / 2 +
            space_width * textH_all_ColumnHeight.length;
        } else if (horizonAlign === "2") {
          left = cellWidth + cumColumnWidth - textW_all + space_width;
        }

        let top = cellHeight - space_height + cumWordHeight - columnHeight;
        if (verticalAlign === "0") {
          top = cellHeight / 2 + cumWordHeight - columnHeight / 2;
        } else if (verticalAlign === "1") {
          top = space_height + cumWordHeight;
        }

        cumWordHeight += word.height;

        word.left = left;
        word.top = top;

        drawLineInfo(word, cancelLine, underLine, {
          width: columnWidth,
          height: word.height,
          left,
          top: top + word.height - space_height,
          asc: word.height,
          desc: 0,
          fs: fontSize,
        });

        textContent.values.push(word);
      }

      cumColumnWidth += columnWidth;
    }
  } else {
    const supportBoundBox = isSupportBoundingBox(renderCtx);
    if (supportBoundBox) {
      renderCtx.textBaseline = "alphabetic";
    } else {
      renderCtx.textBaseline = "bottom";
    }

    if (tb === "2" || isInline) {
      // wrap

      let textW_all = 0; // 拆分后宽高度合计
      let textH_all = 0;
      let textW_all_inner = 0;

      // let oneWordWidth =  getMeasureText(vArr[0], ctx).width;
      let splitIndex = 0;
      const text_all_split: any = {};

      textContent.rotate = rt;
      rt = Math.abs(rt);

      let anchor = 0;
      let preStr;
      let preTextHeight;
      let preTextWidth;
      let preMeasureText;
      let i = 1;
      let spaceOrTwoByte = null;
      let spaceOrTwoByteIndex = null;
      if (isInline) {
        while (i <= inlineStringArr.length) {
          const shareCells = inlineStringArr.slice(anchor, i);
          if (shareCells[shareCells.length - 1].wrap === true) {
            anchor = i;

            if (shareCells.length > 1) {
              for (let s = 0; s < shareCells.length - 1; s += 1) {
                const sc = shareCells[s];
                const item = {
                  content: sc.v,
                  style: sc,
                  width: sc.measureText.width,
                  height:
                    sc.measureText.actualBoundingBoxAscent +
                    sc.measureText.actualBoundingBoxDescent,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: sc.measureText.actualBoundingBoxAscent,
                  desc: sc.measureText.actualBoundingBoxDescent,
                  inline: true,
                  fs: sc.fs,
                };

                // if(rt!=0){//rotate
                //     item.textHeight = sc.textHeight;
                //     item.textWidth = sc.textWidth;
                // }

                text_all_split[splitIndex].push(item);
              }
            }

            if (shareCells.length === 1) {
              const sc = shareCells[0];
              const measureText = getMeasureText(
                "M",
                renderCtx,
                sheetCtx,
                sc.fontset
              );
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              text_all_split[splitIndex].push({
                content: "",
                style: sc,
                width: measureText.width,
                height:
                  measureText.actualBoundingBoxAscent +
                  measureText.actualBoundingBoxDescent,
                left: 0,
                top: 0,
                splitIndex,
                asc: measureText.actualBoundingBoxAscent,
                desc: measureText.actualBoundingBoxDescent,
                inline: true,
                wrap: true,
                fs: sc.fs,
              });
            }

            splitIndex += 1;

            i += 1;

            continue;
          }

          let textWidth = 0;
          let textHeight = 0;
          for (let s = 0; s < shareCells.length; s += 1) {
            const sc = shareCells[s];
            if (_.isNil(sc.measureText)) {
              sc.measureText = getMeasureText(
                sc.v,
                renderCtx,
                sheetCtx,
                sc.fontset
              );
            }
            textWidth += sc.measureText.width;
            textHeight = Math.max(
              sc.measureText.actualBoundingBoxAscent +
                sc.measureText.actualBoundingBoxDescent
            );
            // console.log(sc.v,sc.measureText.width,sc.measureText.actualBoundingBoxAscent,sc.measureText.actualBoundingBoxDescent);
          }

          const width =
            textWidth * Math.cos((rt * Math.PI) / 180) +
            textHeight * Math.sin((rt * Math.PI) / 180); // consider text box wdith and line height

          const height =
            textWidth * Math.sin((rt * Math.PI) / 180) +
            textHeight * Math.cos((rt * Math.PI) / 180); // consider text box wdith and line height

          // textW_all += textW;

          const lastWord = shareCells[shareCells.length - 1];
          if (lastWord.v === " " || checkWordByteLength(lastWord.v) === 2) {
            spaceOrTwoByteIndex = i;
          }

          if (rt !== 0) {
            // rotate
            // console.log("all",anchor, i , str);
            if (
              height + space_height > cellHeight &&
              !_.isNil(text_all_split[splitIndex]) &&
              tb === "2"
            ) {
              // console.log("cut",anchor, i , str);

              if (!_.isNil(spaceOrTwoByteIndex) && spaceOrTwoByteIndex < i) {
                for (let s = 0; s < spaceOrTwoByteIndex - anchor; s += 1) {
                  const sc = shareCells[s];
                  text_all_split[splitIndex].push({
                    content: sc.v,
                    style: sc,
                    width: sc.measureText.width,
                    height:
                      sc.measureText.actualBoundingBoxAscent +
                      sc.measureText.actualBoundingBoxDescent,
                    left: 0,
                    top: 0,
                    splitIndex,
                    asc: sc.measureText.actualBoundingBoxAscent,
                    desc: sc.measureText.actualBoundingBoxDescent,
                    inline: true,
                    fs: sc.fs,
                  });
                }
                anchor = spaceOrTwoByteIndex;

                i = spaceOrTwoByteIndex + 1;

                splitIndex += 1;

                spaceOrTwoByteIndex = null;
              } else {
                anchor = i - 1;

                for (let s = 0; s < shareCells.length - 1; s += 1) {
                  const sc = shareCells[s];
                  text_all_split[splitIndex].push({
                    content: sc.v,
                    style: sc,
                    width: sc.measureText.width,
                    height:
                      sc.measureText.actualBoundingBoxAscent +
                      sc.measureText.actualBoundingBoxDescent,
                    left: 0,
                    top: 0,
                    splitIndex,
                    asc: sc.measureText.actualBoundingBoxAscent,
                    desc: sc.measureText.actualBoundingBoxDescent,
                    inline: true,
                    fs: sc.fs,
                  });
                }

                splitIndex += 1;
              }
            } else if (i === inlineStringArr.length) {
              // console.log("last",anchor, i , str);
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              for (let s = 0; s < shareCells.length; s += 1) {
                const sc = shareCells[s];
                text_all_split[splitIndex].push({
                  content: sc.v,
                  style: sc,
                  width: sc.measureText.width,
                  height:
                    sc.measureText.actualBoundingBoxAscent +
                    sc.measureText.actualBoundingBoxDescent,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: sc.measureText.actualBoundingBoxAscent,
                  desc: sc.measureText.actualBoundingBoxDescent,
                  inline: true,
                  fs: sc.fs,
                });
              }
              break;
            } else {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              i += 1;
            }
          } else {
            // plain
            if (
              width + space_width > cellWidth &&
              !_.isNil(text_all_split[splitIndex]) &&
              tb === "2"
            ) {
              if (!_.isNil(spaceOrTwoByteIndex) && spaceOrTwoByteIndex < i) {
                for (let s = 0; s < spaceOrTwoByteIndex - anchor; s += 1) {
                  const sc = shareCells[s];
                  text_all_split[splitIndex].push({
                    content: sc.v,
                    style: sc,
                    width: sc.measureText.width,
                    height:
                      sc.measureText.actualBoundingBoxAscent +
                      sc.measureText.actualBoundingBoxDescent,
                    left: 0,
                    top: 0,
                    splitIndex,
                    asc: sc.measureText.actualBoundingBoxAscent,
                    desc: sc.measureText.actualBoundingBoxDescent,
                    inline: true,
                    fs: sc.fs,
                  });
                }
                anchor = spaceOrTwoByteIndex;

                i = spaceOrTwoByteIndex + 1;

                splitIndex += 1;

                spaceOrTwoByteIndex = null;
              } else {
                anchor = i - 1;

                for (let s = 0; s < shareCells.length - 1; s += 1) {
                  const sc = shareCells[s];
                  text_all_split[splitIndex].push({
                    content: sc.v,
                    style: sc,
                    width: sc.measureText.width,
                    height:
                      sc.measureText.actualBoundingBoxAscent +
                      sc.measureText.actualBoundingBoxDescent,
                    left: 0,
                    top: 0,
                    splitIndex,
                    asc: sc.measureText.actualBoundingBoxAscent,
                    desc: sc.measureText.actualBoundingBoxDescent,
                    inline: true,
                    fs: sc.fs,
                  });
                }

                splitIndex += 1;
              }
            } else if (i === inlineStringArr.length) {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }

              for (let s = 0; s < shareCells.length; s += 1) {
                const sc = shareCells[s];
                text_all_split[splitIndex].push({
                  content: sc.v,
                  style: sc,
                  width: sc.measureText.width,
                  height:
                    sc.measureText.actualBoundingBoxAscent +
                    sc.measureText.actualBoundingBoxDescent,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: sc.measureText.actualBoundingBoxAscent,
                  desc: sc.measureText.actualBoundingBoxDescent,
                  inline: true,
                  fs: sc.fs,
                });
              }

              break;
            } else {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              i += 1;
            }
          }
        }
      } else {
        value = value.toString();
        while (i <= value.length) {
          const str = value.substring(anchor, i);
          const measureText = getMeasureText(str, renderCtx, sheetCtx);
          const textWidth = measureText.width;
          const textHeight =
            measureText.actualBoundingBoxAscent +
            measureText.actualBoundingBoxDescent;

          const width =
            textWidth * Math.cos((rt * Math.PI) / 180) +
            textHeight * Math.sin((rt * Math.PI) / 180); // consider text box wdith and line height

          const height =
            textWidth * Math.sin((rt * Math.PI) / 180) +
            textHeight * Math.cos((rt * Math.PI) / 180); // consider text box wdith and line height
          const lastWord = str.substr(str.length - 1, 1);
          if (lastWord === " " || checkWordByteLength(lastWord) === 2) {
            spaceOrTwoByte = {
              index: i,
              str,
              width,
              height,
              asc: measureText.actualBoundingBoxAscent,
              desc: measureText.actualBoundingBoxDescent,
            };
          }
          // textW_all += textW;
          // console.log(str,anchor,i);
          if (rt !== 0) {
            // rotate
            // console.log("all",anchor, i , str);
            if (
              height + space_height > cellHeight &&
              !_.isNil(text_all_split[splitIndex])
            ) {
              // console.log("cut",anchor, i , str);

              if (!_.isNil(spaceOrTwoByte) && spaceOrTwoByte.index < i) {
                anchor = spaceOrTwoByte.index;

                i = spaceOrTwoByte.index + 1;

                text_all_split[splitIndex].push({
                  content: spaceOrTwoByte.str,
                  style: fontset,
                  width: spaceOrTwoByte.width,
                  height: spaceOrTwoByte.height,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: spaceOrTwoByte.asc,
                  desc: spaceOrTwoByte.desc,
                  fs: fontSize,
                });

                // console.log(1,anchor,i,splitIndex , spaceOrTwoByte.str);

                splitIndex += 1;

                spaceOrTwoByte = null;
              } else {
                anchor = i - 1;

                text_all_split[splitIndex].push({
                  content: preStr,
                  style: fontset,
                  left: 0,
                  top: 0,
                  splitIndex,
                  height: preTextHeight,
                  width: preTextWidth,
                  asc: measureText.actualBoundingBoxAscent,
                  desc: measureText.actualBoundingBoxDescent,
                  fs: fontSize,
                });

                // console.log(2,anchor,i, splitIndex, preStr);

                splitIndex += 1;
              }
            } else if (i === value.length) {
              // console.log("last",anchor, i , str);
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              text_all_split[splitIndex].push({
                content: str,
                style: fontset,
                left: 0,
                top: 0,
                splitIndex,
                height: textHeight,
                width: textWidth,
                asc: measureText.actualBoundingBoxAscent,
                desc: measureText.actualBoundingBoxDescent,
                fs: fontSize,
              });
              break;
            } else {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              i += 1;
            }
          } else {
            // plain
            if (
              width + space_width > cellWidth &&
              !_.isNil(text_all_split[splitIndex])
            ) {
              // console.log(spaceOrTwoByte, i, anchor);
              if (!_.isNil(spaceOrTwoByte) && spaceOrTwoByte.index < i) {
                anchor = spaceOrTwoByte.index;

                i = spaceOrTwoByte.index + 1;

                text_all_split[splitIndex].push({
                  content: spaceOrTwoByte.str,
                  style: fontset,
                  width: spaceOrTwoByte.width,
                  height: spaceOrTwoByte.height,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: spaceOrTwoByte.asc,
                  desc: spaceOrTwoByte.desc,
                  fs: fontSize,
                });

                splitIndex += 1;

                spaceOrTwoByte = null;
              } else {
                spaceOrTwoByte = null;
                anchor = i - 1;

                text_all_split[splitIndex].push({
                  content: preStr,
                  style: fontset,
                  width: preTextWidth,
                  height: preTextHeight,
                  left: 0,
                  top: 0,
                  splitIndex,
                  asc: preMeasureText.actualBoundingBoxAscent,
                  desc: preMeasureText.actualBoundingBoxDescent,
                  fs: fontSize,
                });

                // console.log(2);

                splitIndex += 1;
              }
            } else if (i === value.length) {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              text_all_split[splitIndex].push({
                content: str,
                style: fontset,
                width: textWidth,
                height: textHeight,
                left: 0,
                top: 0,
                splitIndex,
                asc: measureText.actualBoundingBoxAscent,
                desc: measureText.actualBoundingBoxDescent,
                fs: fontSize,
              });

              break;
            } else {
              if (_.isNil(text_all_split[splitIndex])) {
                text_all_split[splitIndex] = [];
              }
              i += 1;
            }
          }

          preStr = str;
          preTextHeight = textHeight;
          preTextWidth = textWidth;
          preMeasureText = measureText;
        }
      }

      const split_all_size = [];
      let oneLinemaxWordCount = 0;
      // console.log("split",splitIndex, text_all_split);
      const splitLen = Object.keys(text_all_split).length;
      if (splitLen === 0) return textContent;
      for (let j = 0; j < splitLen; j += 1) {
        const splitLists = text_all_split[j];
        if (_.isNil(splitLists)) {
          continue;
        }
        let sWidth = 0;
        let sHeight = 0;
        let maxDesc = 0;
        let maxAsc = 0;
        let lineHeight = 0;
        let maxWordCount = 0;
        for (let s = 0; s < splitLists.length; s += 1) {
          const sp = splitLists[s];
          if (rt !== 0) {
            // rotate
            sWidth += sp.width;
            sHeight = Math.max(
              sHeight,
              sp.height - (supportBoundBox ? sp.desc : 0)
            );
          } else {
            // plain
            sWidth += sp.width;
            sHeight = Math.max(
              sHeight,
              sp.height - (supportBoundBox ? sp.desc : 0)
            );
          }
          maxDesc = Math.max(maxDesc, supportBoundBox ? sp.desc : 0);
          maxAsc = Math.max(maxAsc, sp.asc);
          maxWordCount += 1;
        }

        lineHeight = sHeight / 2;
        oneLinemaxWordCount = Math.max(oneLinemaxWordCount, maxWordCount);
        if (rt !== 0) {
          // rotate
          sHeight += lineHeight;
          textW_all_inner = Math.max(textW_all_inner, sWidth);
          // textW_all =  Math.max(textW_all, sWidth+ (textH_all)/Math.tan(rt*Math.PI/180));
          textH_all += sHeight;
        } else {
          // plain
          // console.log("textH_all",textW_all, textH_all);
          sHeight += lineHeight;
          textW_all = Math.max(textW_all, sWidth);
          textH_all += sHeight;
        }

        split_all_size.push({
          width: sWidth,
          height: sHeight,
          desc: maxDesc,
          asc: maxAsc,
          lineHeight,
          wordCount: maxWordCount,
        });
      }
      // console.log(textH_all,textW_all,textW_all_inner);
      // let cumColumnWidth = 0;
      let cumWordHeight = 0;
      let cumColumnWidth = 0;
      const rtPI = (rt * Math.PI) / 180;
      const lastLine = split_all_size[splitLen - 1];
      const lastLineSpaceHeight = lastLine.lineHeight;
      textH_all = textH_all - lastLineSpaceHeight + lastLine.desc;
      const rw = textH_all / Math.sin(rtPI) + textW_all_inner * Math.cos(rtPI);
      const rh = textW_all_inner * Math.sin(rtPI);
      let fixOneLineLeft = 0;

      if (rt !== 0) {
        if (splitLen === 1) {
          textW_all = textW_all_inner + 2 * (textH_all / Math.tan(rtPI));
          fixOneLineLeft = textH_all / Math.tan(rtPI);
        } else {
          textW_all = textW_all_inner + textH_all / Math.tan(rtPI);
        }
        textContent.textWidthAll = rw;
        textContent.textHeightAll = rh;
      } else {
        textContent.textWidthAll = textW_all;
        textContent.textHeightAll = textH_all;
      }

      if (isMode === "onlyWidth") {
        // console.log("plainWrap", textContent,cell, option);
        return textContent;
      }

      if (rt !== 0 && Number(isRotateUp) === 1) {
        renderCtx.textAlign = "end";
        for (let j = 0; j < splitLen; j += 1) {
          const splitLists = text_all_split[j];
          if (_.isNil(splitLists)) {
            continue;
          }
          const size = split_all_size[j];

          cumColumnWidth = 0;

          for (let c = splitLists.length - 1; c >= 0; c -= 1) {
            const wordGroup = splitLists[c];
            let left;
            let top;
            if (rt !== 0) {
              // rotate
              const y = cumWordHeight + size.asc;
              const x =
                cumWordHeight / Math.tan(rtPI) -
                cumColumnWidth +
                textW_all_inner;
              if (horizonAlign === "0") {
                // center
                if (verticalAlign === "0") {
                  // mid

                  left =
                    x +
                    cellWidth / 2 -
                    textW_all / 2 +
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y +
                    cellHeight / 2 -
                    textH_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top
                  left = x + cellWidth / 2 - textW_all / 2;
                  top = y - (textH_all / 2 - rh / 2);
                } else if (verticalAlign === "2") {
                  // bottom
                  left =
                    x +
                    cellWidth / 2 -
                    textW_all / 2 +
                    lastLineSpaceHeight * Math.cos(rtPI);
                  top =
                    y +
                    cellHeight -
                    rh / 2 -
                    textH_all / 2 -
                    lastLineSpaceHeight * Math.cos(rtPI);
                }
              } else if (horizonAlign === "1") {
                // left
                if (verticalAlign === "0") {
                  // mid
                  left =
                    x -
                    (rh * Math.sin(rtPI)) / 2 +
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y +
                    cellHeight / 2 +
                    (rh * Math.cos(rtPI)) / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top
                  left = x - rh * Math.sin(rtPI);
                  top = y + rh * Math.cos(rtPI);
                } else if (verticalAlign === "2") {
                  // bottom
                  left = x + lastLineSpaceHeight * Math.cos(rtPI);
                  top = y + cellHeight - lastLineSpaceHeight * Math.cos(rtPI);
                }
              } else if (horizonAlign === "2") {
                // right
                if (verticalAlign === "0") {
                  // mid
                  left =
                    x +
                    cellWidth -
                    rw / 2 -
                    (textW_all_inner / 2 + textH_all / 2 / Math.tan(rtPI)) +
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y +
                    cellHeight / 2 -
                    textH_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top fixOneLineLeft
                  left = x + cellWidth - textW_all + fixOneLineLeft;
                  top = y - textH_all;
                } else if (verticalAlign === "2") {
                  // bottom
                  left =
                    x +
                    cellWidth -
                    rw * Math.cos(rtPI) +
                    lastLineSpaceHeight * Math.cos(rtPI);
                  top =
                    y +
                    cellHeight -
                    rw * Math.sin(rtPI) -
                    lastLineSpaceHeight * Math.cos(rtPI);
                }
              }
            }

            wordGroup.left = left;
            wordGroup.top = top;

            // console.log(left, top,  cumWordHeight, size.height);

            drawLineInfo(wordGroup, cancelLine, underLine, {
              width: wordGroup.width,
              height: wordGroup.height,
              left: (left || 0) - wordGroup.width,
              top,
              asc: size.asc,
              desc: size.desc,
              fs: wordGroup.fs,
            });

            textContent.values.push(wordGroup);

            cumColumnWidth += wordGroup.width;
          }

          cumWordHeight += size.height;
        }
      } else {
        for (let j = 0; j < splitLen; j += 1) {
          const splitLists = text_all_split[j];
          if (_.isNil(splitLists)) {
            continue;
          }
          const size = split_all_size[j];

          cumColumnWidth = 0;

          for (let c = 0; c < splitLists.length; c += 1) {
            const wordGroup = splitLists[c];
            let left;
            let top;
            if (rt !== 0) {
              // rotate
              const y = cumWordHeight + size.asc;
              const x =
                (textH_all - cumWordHeight) / Math.tan(rtPI) + cumColumnWidth;

              if (horizonAlign === "0") {
                // center
                if (verticalAlign === "0") {
                  // mid

                  left =
                    x +
                    cellWidth / 2 -
                    textW_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y +
                    cellHeight / 2 -
                    textH_all / 2 +
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top
                  left =
                    x +
                    cellWidth / 2 -
                    textW_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y -
                    (textH_all / 2 - rh / 2) +
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "2") {
                  // bottom
                  left =
                    x +
                    cellWidth / 2 -
                    textW_all / 2 -
                    lastLineSpaceHeight * Math.cos(rtPI);
                  top =
                    y +
                    cellHeight -
                    rh / 2 -
                    textH_all / 2 -
                    lastLineSpaceHeight * Math.cos(rtPI);
                }
              } else if (horizonAlign === "1") {
                // left
                if (verticalAlign === "0") {
                  // mid
                  left =
                    x -
                    (rh * Math.sin(rtPI)) / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y -
                    textH_all +
                    cellHeight / 2 -
                    (rh * Math.cos(rtPI)) / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top
                  left = x;
                  top = y - textH_all;
                } else if (verticalAlign === "2") {
                  // bottom
                  left =
                    x -
                    rh * Math.sin(rtPI) -
                    lastLineSpaceHeight * Math.cos(rtPI);
                  top =
                    y -
                    textH_all +
                    cellHeight -
                    rh * Math.cos(rtPI) -
                    lastLineSpaceHeight * Math.cos(rtPI);
                }
              } else if (horizonAlign === "2") {
                // right
                if (verticalAlign === "0") {
                  // mid
                  left =
                    x +
                    cellWidth -
                    rw / 2 -
                    textW_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                  top =
                    y +
                    cellHeight / 2 -
                    textH_all / 2 -
                    (lastLineSpaceHeight * Math.cos(rtPI)) / 2;
                } else if (verticalAlign === "1") {
                  // top fixOneLineLeft
                  left = x + cellWidth - rw * Math.cos(rtPI);
                  top = y + rh * Math.cos(rtPI);
                } else if (verticalAlign === "2") {
                  // bottom
                  left =
                    x +
                    cellWidth -
                    textW_all -
                    lastLineSpaceHeight * Math.cos(rtPI) +
                    fixOneLineLeft;
                  top = y + cellHeight - lastLineSpaceHeight * Math.cos(rtPI);
                }
              }

              drawLineInfo(wordGroup, cancelLine, underLine, {
                width: wordGroup.width,
                height: wordGroup.height,
                left,
                top,
                asc: size.asc,
                desc: size.desc,
                fs: wordGroup.fs,
              });
            } else {
              // plain
              left = space_width + cumColumnWidth;
              if (horizonAlign === "0") {
                // + space_width*textH_all_ColumnHeight.length
                left = cellWidth / 2 + cumColumnWidth - size.width / 2;
              } else if (horizonAlign === "2") {
                left = cellWidth + cumColumnWidth - size.width;
              }

              top =
                cellHeight -
                space_height +
                cumWordHeight +
                size.asc -
                textH_all;
              if (verticalAlign === "0") {
                top = cellHeight / 2 + cumWordHeight - textH_all / 2 + size.asc;
              } else if (verticalAlign === "1") {
                top = space_height + cumWordHeight + size.asc;
              }

              drawLineInfo(wordGroup, cancelLine, underLine, {
                width: wordGroup.width,
                height: wordGroup.height,
                left,
                top,
                asc: size.asc,
                desc: size.desc,
                fs: wordGroup.fs,
              });
            }

            wordGroup.left = left;
            wordGroup.top = top;

            textContent.values.push(wordGroup);

            cumColumnWidth += wordGroup.width;
          }

          cumWordHeight += size.height;
        }
      }

      textContent.type = "plainWrap";

      if (rt !== 0) {
        // let leftCenter = (textW_all + textH_all/Math.tan(rt*Math.PI/180))/2;
        // let topCenter = textH_all/2;

        // if(isRotateUp=="1"){
        //     textContent.textLeftAll += leftCenter;
        //     textContent.textTopAll += topCenter;
        // }
        // else {
        //     textContent.textLeftAll += leftCenter;
        //     textContent.textTopAll -= topCenter;
        // }

        if (horizonAlign === "0") {
          // center
          textContent.textLeftAll = cellWidth / 2;
          if (verticalAlign === "0") {
            // mid
            textContent.textTopAll = cellHeight / 2;
          } else if (verticalAlign === "1") {
            // top
            textContent.textTopAll = rh / 2;
          } else if (verticalAlign === "2") {
            // bottom
            textContent.textTopAll = cellHeight - rh / 2;
          }
        } else if (horizonAlign === "1") {
          // left
          if (verticalAlign === "0") {
            // mid
            textContent.textLeftAll = 0;
            textContent.textTopAll = cellHeight / 2;
          } else if (verticalAlign === "1") {
            // top
            textContent.textLeftAll = 0;
            textContent.textTopAll = 0;
          } else if (verticalAlign === "2") {
            // bottom
            textContent.textLeftAll = 0;
            textContent.textTopAll = cellHeight;
          }
        } else if (horizonAlign === "2") {
          // right
          if (verticalAlign === "0") {
            // mid
            textContent.textLeftAll = cellWidth - rw / 2;
            textContent.textTopAll = cellHeight / 2;
          } else if (verticalAlign === "1") {
            // top
            textContent.textLeftAll = cellWidth;
            textContent.textTopAll = 0;
          } else if (verticalAlign === "2") {
            // bottom
            textContent.textLeftAll = cellWidth;
            textContent.textTopAll = cellHeight;
          }
        }
      }
      // else{
      //     textContent.textWidthAll = textW_all;
      //     textContent.textHeightAll = textH_all;
      // }
    } else {
      const measureText = getMeasureText(value, renderCtx, sheetCtx);
      const textWidth = measureText.width;
      const textHeight =
        measureText.actualBoundingBoxDescent +
        measureText.actualBoundingBoxAscent;

      textContent.rotate = rt;

      rt = Math.abs(rt);
      const rtPI = (rt * Math.PI) / 180;

      const textWidthAll =
        textWidth * Math.cos(rtPI) + textHeight * Math.sin(rtPI); // consider text box wdith and line height

      const textHeightAll =
        textWidth * Math.sin(rtPI) + textHeight * Math.cos(rtPI); // consider text box wdith and line height

      if (rt !== 0) {
        textContent.textHeightAll = textHeightAll;
      } else {
        textContent.textHeightAll =
          textHeightAll +
          textHeight / 2 -
          measureText.actualBoundingBoxDescent -
          space_height;
      }
      textContent.textWidthAll = textWidthAll;

      // console.log(textContent.textWidthAll , textContent.textHeightAll);
      if (isMode === "onlyWidth") {
        // console.log("plain", textContent,cell, option);
        return textContent;
      }

      const width = textWidthAll;
      const height = textHeightAll;

      let left = space_width + textHeight * Math.sin(rtPI) * isRotateUp; // 默认为1，左对齐
      if (horizonAlign === "0") {
        // 居中对齐
        left =
          cellWidth / 2 - width / 2 + textHeight * Math.sin(rtPI) * isRotateUp;
      } else if (horizonAlign === "2") {
        // 右对齐
        left =
          cellWidth -
          space_width -
          width +
          textHeight * Math.sin(rtPI) * isRotateUp;
      }

      let top =
        cellHeight -
        space_height -
        height +
        measureText.actualBoundingBoxAscent * Math.cos(rtPI) +
        textWidth * Math.sin(rtPI) * isRotateUp; // 默认为2，下对齐
      if (verticalAlign === "0") {
        // 居中对齐
        top =
          cellHeight / 2 -
          height / 2 +
          measureText.actualBoundingBoxAscent * Math.cos(rtPI) +
          textWidth * Math.sin(rtPI) * isRotateUp;
      } else if (verticalAlign === "1") {
        // 上对齐
        top =
          space_height +
          measureText.actualBoundingBoxAscent * Math.cos(rtPI) +
          textWidth * Math.sin(rtPI) * isRotateUp;
      }

      textContent.type = "plain";

      const wordGroup = {
        content: value,
        style: fontset,
        width,
        height,
        left,
        top,
      };

      drawLineInfo(wordGroup, cancelLine, underLine, {
        width: textWidth,
        height: textHeight,
        left,
        top,
        asc: measureText.actualBoundingBoxAscent,
        desc: measureText.actualBoundingBoxDescent,
        fs: fontSize,
      });

      textContent.values.push(wordGroup);

      textContent.textLeftAll = left;
      textContent.textTopAll = top;

      textContent.asc = measureText.actualBoundingBoxAscent;
      textContent.desc = measureText.actualBoundingBoxDescent;

      // console.log("plain",left,top);
    }
  }
  return textContent;
}
