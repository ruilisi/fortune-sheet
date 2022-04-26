import _ from "lodash";
import { Freezen } from "..";
import { Context, getFlowdata } from "../context";
import {
  cancelActiveImgItem,
  cancelPaintModel,
  formulaCache,
  functionHTMLGenerate,
  israngeseleciton,
  rangeHightlightselected,
  rangeSetValue,
  onCommentBoxMove,
  onCommentBoxMoveEnd,
  onCommentBoxResize,
  onCommentBoxResizeEnd,
  onImageMove,
  onImageMoveEnd,
  onImageResize,
  onImageResizeEnd,
  removeEditingComment,
  overShowComment,
  rangeDrag,
  onFormulaRangeDragEnd,
  createFormulaRangeSelect,
  createRangeHightlight,
} from "../modules";
import { scrollToFrozenRowCol } from "../modules/freeze";
import {
  cancelFunctionrangeSelected,
  mergeBorder,
  mergeMoveMain,
  updateCell,
  luckysheetUpdateCell,
} from "../modules/cell";
import {
  colLocation,
  colLocationByIndex,
  rowLocation,
  rowLocationByIndex,
} from "../modules/location";
import {
  checkProtectionAllSelected,
  checkProtectionSelectLockedOrUnLockedCells,
} from "../modules/protection";
import {
  normalizeSelection,
  pasteHandlerOfPaintModel,
} from "../modules/selection";
import { Settings } from "../settings";
import { GlobalCache } from "../types";
import { getSheetIndex } from "../utils";

let mouseWheelUniqueTimeout: ReturnType<typeof setTimeout>;

export function handleGlobalWheel(
  ctx: Context,
  e: WheelEvent,
  cache: GlobalCache,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement
) {
  let { scrollLeft } = scrollbarX;
  const { scrollTop } = scrollbarY;
  let visibledatacolumn_c = ctx.visibledatacolumn;
  let visibledatarow_c = ctx.visibledatarow;

  // if (luckysheetFreezen.freezenhorizontaldata != null) {
  //   visibledatarow_c = luckysheetFreezen.freezenhorizontaldata[3];
  // }

  // if (luckysheetFreezen.freezenverticaldata != null) {
  //   visibledatacolumn_c = luckysheetFreezen.freezenverticaldata[3];
  // }

  clearTimeout(mouseWheelUniqueTimeout);

  // if(ctx.visibledatacolumn.length!=visibledatacolumn_c.length){
  if (cache.visibleColumnsUnique != null) {
    visibledatacolumn_c = cache.visibleColumnsUnique;
  } else {
    visibledatacolumn_c = _.uniq(visibledatacolumn_c);
    cache.visibleColumnsUnique = visibledatacolumn_c;
  }
  // }

  // if(ctx.visibledatarow.length!=visibledatarow_c.length){
  if (cache.visibleRowsUnique != null) {
    visibledatarow_c = cache.visibleRowsUnique;
  } else {
    visibledatarow_c = _.uniq(visibledatarow_c);
    cache.visibleRowsUnique = visibledatarow_c;
  }
  // }

  // visibledatacolumn_c = ArrayUnique(visibledatacolumn_c);
  // visibledatarow_c = ArrayUnique(visibledatarow_c);

  const row_st = _.sortedIndex(visibledatarow_c, scrollTop) + 1;

  // if (luckysheetFreezen.freezenhorizontaldata != null) {
  //   row_st = luckysheet_searcharray(
  //     visibledatarow_c,
  //     scrollTop + luckysheetFreezen.freezenhorizontaldata[0]
  //   );
  // }

  let rowscroll = 0;

  // TODO const scrollNum = e.deltaFactor < 40 ? 1 : e.deltaFactor < 80 ? 2 : 3;
  const scrollNum = 1;

  // 一次滚动三行或三列
  if (e.deltaY !== 0) {
    let row_ed;
    let step = Math.round(scrollNum / ctx.zoomRatio);
    step = step < 1 ? 1 : step;
    if (e.deltaY > 0) {
      row_ed = row_st + step;

      if (row_ed >= visibledatarow_c.length) {
        row_ed = visibledatarow_c.length - 1;
      }
    } else {
      row_ed = row_st - step;

      if (row_ed < 0) {
        row_ed = 0;
      }
    }

    rowscroll = row_ed === 0 ? 0 : visibledatarow_c[row_ed - 1];

    // if (luckysheetFreezen.freezenhorizontaldata != null) {
    //   rowscroll -= luckysheetFreezen.freezenhorizontaldata[0];
    // }

    // 通过滚动scrollbar来让浏览器自动控制滚动边界
    scrollbarY.scrollTop = rowscroll;
  } else if (e.deltaX !== 0) {
    if (e.deltaX > 0) {
      scrollLeft += 20 * ctx.zoomRatio;
    } else {
      scrollLeft -= 20 * ctx.zoomRatio;
    }

    // 通过滚动scrollbar来让浏览器自动控制滚动边界
    scrollbarX.scrollLeft = scrollLeft;
  }

  mouseWheelUniqueTimeout = setTimeout(() => {
    delete cache.visibleColumnsUnique;
    delete cache.visibleRowsUnique;
  }, 500);

  e.preventDefault();
}

function fixPositionOnFrozenCells(
  freeze: Freezen | undefined,
  x: number,
  y: number,
  mouseX: number,
  mouseY: number
) {
  if (!freeze) return [x, y];

  const freezenverticaldata = freeze?.vertical?.freezenverticaldata;
  const freezenhorizontaldata = freeze?.horizontal?.freezenhorizontaldata;

  if (
    freezenverticaldata != null &&
    mouseX < freezenverticaldata[0] - freezenverticaldata[2]
  ) {
    x = mouseX + freezenverticaldata[2];
  }

  if (
    freezenhorizontaldata != null &&
    mouseY < freezenhorizontaldata[0] - freezenhorizontaldata[2]
  ) {
    y = mouseY + freezenhorizontaldata[2];
  }

  return [x, y];
}

export function handleCellAreaMouseDown(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  container: HTMLDivElement,
  fxInput: HTMLDivElement
) {
  ctx.contextMenu = undefined;
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  // //有批注在编辑时
  removeEditingComment(ctx, globalCache);
  // TODO set MouseDown state to context
  // const mouse = mousePosition(
  //   e.nativeEvent.offsetX,
  //   e.nativeEvent.offsetY,
  //   context
  // );
  cancelActiveImgItem(ctx, globalCache);
  const rect = container.getBoundingClientRect();
  const mouseX = e.pageX - rect.left;
  const mouseY = e.pageY - rect.top;
  let x = mouseX + ctx.scrollLeft;
  let y = mouseY + ctx.scrollTop;
  if (x >= rect.width + ctx.scrollLeft || y >= rect.height + ctx.scrollTop) {
    return;
  }
  const freeze = globalCache.freezen?.[ctx.currentSheetIndex];
  [x, y] = fixPositionOnFrozenCells(freeze, x, y, mouseX, mouseY);

  const row_location = rowLocation(y, ctx.visibledatarow);
  let row = row_location[1];
  let row_pre = row_location[0];
  let row_index = row_location[2];

  const col_location = colLocation(x, ctx.visibledatacolumn);
  let col = col_location[1];
  let col_pre = col_location[0];
  let col_index = col_location[2];

  let row_index_ed = row_index;
  let col_index_ed = col_index;
  const margeset = mergeBorder(ctx, flowdata, row_index, col_index);
  if (margeset) {
    [row_pre, row, row_index, row_index_ed] = margeset.row;
    [col_pre, col, col_index, col_index_ed] = margeset.column;
  }

  // //单元格单击之前
  // if (
  //   !method.createHookFunction(
  //     "cellMousedownBefore",
  //     ctx.flowdata[row_index][col_index],
  //     {
  //       r: row_index,
  //       c: col_index,
  //       start_r: row_pre,
  //       start_c: col_pre,
  //       end_r: row,
  //       end_c: col,
  //     },
  //     sheetFile,
  //     luckysheetTableContent
  //   )
  // ) {
  //   return;
  // }

  // //数据验证 单元格聚焦
  // dataVerificationCtrl.cellFocus(row_index, col_index, true);

  // //若点击单元格部分不在视图内
  if (col_pre < ctx.scrollLeft) {
    ctx.scrollLeft = col_pre;
  }

  if (row_pre < ctx.scrollTop) {
    ctx.scrollTop = row_pre;
  }

  // //mousedown是右键
  if (e.button === 2) {
    // $("#luckysheet-dataVerification-showHintBox").hide();

    // 如果右键在选区内, 停止mousedown处理
    let isInSelection = false;
    _.forEach(ctx.luckysheet_select_save, (obj_s) => {
      if (
        obj_s.row != null &&
        row_index >= obj_s.row[0] &&
        row_index <= obj_s.row[1] &&
        col_index >= obj_s.column[0] &&
        col_index <= obj_s.column[1]
      ) {
        isInSelection = true;
        return false;
      }
      return true;
    });

    if (isInSelection) {
      return;
    }
  }

  // //单元格数据下钻
  // if (
  //   ctx.flowdata[row_index] != null &&
  //   ctx.flowdata[row_index][col_index] != null &&
  //   ctx.flowdata[row_index][col_index].dd != null
  // ) {
  //   if (
  //     luckysheetConfigsetting.fireMousedown != null &&
  //     getObjType(luckysheetConfigsetting.fireMousedown) == "function"
  //   ) {
  //     luckysheetConfigsetting.fireMousedown(
  //       ctx.flowdata[row_index][col_index].dd
  //     );
  //     return;
  //   }
  // }

  // //链接 单元格聚焦
  // if (
  //   hyperlinkCtrl.hyperlink &&
  //   hyperlinkCtrl.hyperlink[row_index + "_" + col_index] &&
  //   event.which != "3"
  // ) {
  //   hyperlinkCtrl.cellFocus(row_index, col_index);
  //   return;
  // }

  ctx.luckysheet_scroll_status = true;

  // 公式相关
  if (ctx.luckysheetCellUpdate.length > 0) {
    if (
      formulaCache.rangestart ||
      formulaCache.rangedrag_column_start ||
      formulaCache.rangedrag_row_start ||
      israngeseleciton()
    ) {
      // 公式选区
      let rowseleted = [row_index, row_index_ed];
      let columnseleted = [col_index, col_index_ed];

      let left = col_pre;
      let width = col - col_pre - 1;
      let top = row_pre;
      let height = row - row_pre - 1;

      if (e.shiftKey) {
        const last = formulaCache.func_selectedrange;

        top = 0;
        height = 0;
        rowseleted = [];

        if (
          last == null ||
          last.top == null ||
          last.height == null ||
          last.row_focus == null ||
          last.left == null ||
          last.width == null
        )
          return;
        if (last.top > row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;

          if (last.row[1] > last.row_focus) {
            last.row[1] = last.row_focus;
          }

          rowseleted = [row_index, last.row[1]];
        } else if (last.top === row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;
          rowseleted = [row_index, last.row[0]];
        } else {
          top = last.top;
          height = row - last.top - 1;

          if (last.row[0] < last.row_focus) {
            last.row[0] = last.row_focus;
          }

          rowseleted = [last.row[0], row_index];
        }

        left = 0;
        width = 0;
        columnseleted = [];
        if (last.left > col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;
          if (last.column == null || last.column_focus == null) return;
          if (last.column[1] > last.column_focus) {
            last.column[1] = last.column_focus;
          }

          columnseleted = [col_index, last.column[1]];
        } else if (last.left === col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;
          columnseleted = [col_index, last.column[0]];
        } else {
          left = last.left;
          width = col - last.left - 1;
          if (last.column == null || last.column_focus == null) return;

          if (last.column[0] < last.column_focus) {
            last.column[0] = last.column_focus;
          }

          columnseleted = [last.column[0], col_index];
        }

        const changeparam = mergeMoveMain(
          ctx,
          columnseleted,
          rowseleted,
          last,
          top,
          height,
          left,
          width
        );
        if (changeparam != null) {
          // @ts-ignore
          [columnseleted, rowseleted, top, height, left, width] = changeparam;
        }

        // luckysheet_count_show(
        //   left,
        //   top,
        //   width,
        //   height,
        //   rowseleted,
        //   columnseleted
        // ); //先不搞

        last.row = rowseleted;
        last.column = columnseleted;

        last.left_move = left;
        last.width_move = width;
        last.top_move = top;
        last.height_move = height;

        formulaCache.func_selectedrange = last;
      } else if (
        e.ctrlKey &&
        _.last(cellInput.querySelectorAll("span"))?.innerText !== ","
      ) {
        // 按住ctrl 选择选区时  先处理上一个选区
        let vText = cellInput.innerText;

        if (vText[vText.length - 1] === ")") {
          vText = vText.substring(0, vText.length - 1); // 先删除最后侧的圆括号)
        }

        if (vText.length > 0) {
          const lastWord = vText.substring(vText.length - 1, 1);
          if (lastWord !== "," && lastWord !== "=" && lastWord !== "(") {
            vText += ",";
          }
        }
        if (vText.length > 0 && vText.substring(0, 1) === "=") {
          vText = functionHTMLGenerate(vText);

          if (window.getSelection) {
            // all browsers, except IE before version 9
            const currSelection = window.getSelection();
            if (currSelection == null) return;
            formulaCache.functionRangeIndex = [
              _.indexOf(
                currSelection.anchorNode?.parentNode?.parentNode?.childNodes,
                // @ts-ignore
                currSelection.anchorNode?.parentNode
              ),
              currSelection.anchorOffset,
            ];
          } else {
            // Internet Explorer before version 9
            // @ts-ignore
            const textRange = document.selection.createRange();
            formulaCache.functionRangeIndex = textRange;
          }

          /* 在显示前重新 + 右侧的圆括号) */
          cellInput.innerHTML = vText;

          cancelFunctionrangeSelected(ctx);
          createRangeHightlight(ctx, vText);
        }

        formulaCache.rangestart = false;
        formulaCache.rangedrag_column_start = false;
        formulaCache.rangedrag_row_start = false;

        fxInput.innerHTML = vText;

        rangeHightlightselected(ctx, cellInput);

        // 再进行 选区的选择
        israngeseleciton();
        formulaCache.func_selectedrange = {
          left,
          width,
          top,
          height,
          left_move: left,
          width_move: width,
          top_move: top,
          height_move: height,
          row: rowseleted,
          column: columnseleted,
          row_focus: row_index,
          column_focus: col_index,
        };
      } else {
        formulaCache.func_selectedrange = {
          left,
          width,
          top,
          height,
          left_move: left,
          width_move: width,
          top_move: top,
          height_move: height,
          row: rowseleted,
          column: columnseleted,
          row_focus: row_index,
          column_focus: col_index,
        };
      }

      rangeSetValue(ctx, cellInput, { row: rowseleted, column: columnseleted });

      formulaCache.rangestart = true;
      formulaCache.rangedrag_column_start = false;
      formulaCache.rangedrag_row_start = false;

      formulaCache.selectingRangeIndex = formulaCache.rangechangeindex;
      createFormulaRangeSelect(ctx, {
        rangeIndex: formulaCache.rangechangeindex,
        left,
        top,
        width,
        height,
      });
      // $("#luckysheet-formula-functionrange-select")
      //   .css({
      //     left,
      //     width,
      //     top,
      //     height,
      //   })
      //   .show();
      // $("#luckysheet-formula-help-c").hide();
      // luckysheet_count_show(
      //   left,
      //   top,
      //   width,
      //   height,
      //   rowseleted,
      //   columnseleted
      // );

      // setTimeout(() => {
      // const currSelection = window.getSelection();
      // @ts-ignore
      // const anchorOffset = currSelection.anchorNode;

      // let $editor;
      // if (
      //   $("#luckysheet-search-formula-parm").is(":visible") ||
      //   $("#luckysheet-search-formula-parm-select").is(":visible")
      // ) {
      //   $editor = cellInput;
      //   formulaCache.rangechangeindex = formulaCache.data_parm_index;
      // } else {
      //   $editor = $(anchorOffset).closest("div");
      // }

      // const $span = $editor.find(
      //   `span[rangeindex='${formulaCache.rangechangeindex}']`
      // );

      //   setCaretPosition($span.get(0), 0, $span.html().length);
      // }, 1);
      // return;

      // TODO 下面是临时加的逻辑，待公式选区实现后删除
      // updateCell(
      //   ctx,
      //   ctx.luckysheetCellUpdate[0],
      //   ctx.luckysheetCellUpdate[1],
      //   cellInput
      // );
      // ctx.luckysheet_select_status = true;
      return; // skip ctx.luckysheet_select_save to prevent clearing cellInput
    }
    updateCell(
      ctx,
      ctx.luckysheetCellUpdate[0],
      ctx.luckysheetCellUpdate[1],
      cellInput
    );
    ctx.luckysheet_select_status = true;

    //     if ($("#luckysheet-info").is(":visible")) {
    //       ctx.luckysheet_select_status = false;
    //     }
  }
  if (
    checkProtectionSelectLockedOrUnLockedCells(
      ctx,
      row_index,
      col_index,
      ctx.currentSheetIndex
    )
  ) {
    ctx.luckysheet_select_status = true;
  }

  // //条件格式 应用范围可选择多个单元格
  // if ($("#luckysheet-multiRange-dialog").is(":visible")) {
  //   conditionformat.selectStatus = true;
  //   ctx.luckysheet_select_status = false;

  //   if (event.shiftKey) {
  //     let last =
  //       conditionformat.selectRange[conditionformat.selectRange.length - 1];

  //     let top = 0,
  //       height = 0,
  //       rowseleted = [];
  //     if (last.top > row_pre) {
  //       top = row_pre;
  //       height = last.top + last.height - row_pre;

  //       if (last.row[1] > last.row_focus) {
  //         last.row[1] = last.row_focus;
  //       }

  //       rowseleted = [row_index, last.row[1]];
  //     } else if (last.top == row_pre) {
  //       top = row_pre;
  //       height = last.top + last.height - row_pre;
  //       rowseleted = [row_index, last.row[0]];
  //     } else {
  //       top = last.top;
  //       height = row - last.top - 1;

  //       if (last.row[0] < last.row_focus) {
  //         last.row[0] = last.row_focus;
  //       }

  //       rowseleted = [last.row[0], row_index];
  //     }

  //     let left = 0,
  //       width = 0,
  //       columnseleted = [];
  //     if (last.left > col_pre) {
  //       left = col_pre;
  //       width = last.left + last.width - col_pre;

  //       if (last.column[1] > last.column_focus) {
  //         last.column[1] = last.column_focus;
  //       }

  //       columnseleted = [col_index, last.column[1]];
  //     } else if (last.left == col_pre) {
  //       left = col_pre;
  //       width = last.left + last.width - col_pre;
  //       columnseleted = [col_index, last.column[0]];
  //     } else {
  //       left = last.left;
  //       width = col - last.left - 1;

  //       if (last.column[0] < last.column_focus) {
  //         last.column[0] = last.column_focus;
  //       }

  //       columnseleted = [last.column[0], col_index];
  //     }

  //     let changeparam = menuButton.mergeMoveMain(
  //       columnseleted,
  //       rowseleted,
  //       last,
  //       top,
  //       height,
  //       left,
  //       width
  //     );
  //     if (changeparam != null) {
  //       columnseleted = changeparam[0];
  //       rowseleted = changeparam[1];
  //       top = changeparam[2];
  //       height = changeparam[3];
  //       left = changeparam[4];
  //       width = changeparam[5];
  //     }

  //     last["row"] = rowseleted;
  //     last["column"] = columnseleted;

  //     last["left_move"] = left;
  //     last["width_move"] = width;
  //     last["top_move"] = top;
  //     last["height_move"] = height;

  //     conditionformat.selectRange[conditionformat.selectRange.length - 1] =
  //       last;
  //   } else if (event.ctrlKey) {
  //     conditionformat.selectRange.push({
  //       left: col_pre,
  //       width: col - col_pre - 1,
  //       top: row_pre,
  //       height: row - row_pre - 1,
  //       left_move: col_pre,
  //       width_move: col - col_pre - 1,
  //       top_move: row_pre,
  //       height_move: row - row_pre - 1,
  //       row: [row_index, row_index_ed],
  //       column: [col_index, col_index_ed],
  //       row_focus: row_index,
  //       column_focus: col_index,
  //     });
  //   } else {
  //     conditionformat.selectRange = [];
  //     conditionformat.selectRange.push({
  //       left: col_pre,
  //       width: col - col_pre - 1,
  //       top: row_pre,
  //       height: row - row_pre - 1,
  //       left_move: col_pre,
  //       width_move: col - col_pre - 1,
  //       top_move: row_pre,
  //       height_move: row - row_pre - 1,
  //       row: [row_index, row_index_ed],
  //       column: [col_index, col_index_ed],
  //       row_focus: row_index,
  //       column_focus: col_index,
  //     });
  //   }

  //   selectionCopyShow(conditionformat.selectRange);

  //   let range = conditionformat.getTxtByRange(conditionformat.selectRange);
  //   $("#luckysheet-multiRange-dialog input").val(range);

  //   return;
  // } else {
  //   conditionformat.selectStatus = false;
  //   conditionformat.selectRange = [];
  // }

  // //条件格式 条件值只能选择单个单元格
  // if ($("#luckysheet-singleRange-dialog").is(":visible")) {
  //   ctx.luckysheet_select_status = false;

  //   selectionCopyShow([
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //   ]);

  //   let range = getRangetxt(
  //     ctx.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     ctx.currentSheetIndex
  //   );
  //   $("#luckysheet-singleRange-dialog input").val(range);

  //   return;
  // }

  // //数据验证 单元格范围选择
  // if ($("#luckysheet-dataVerificationRange-dialog").is(":visible")) {
  //   dataVerificationCtrl.selectStatus = true;
  //   ctx.luckysheet_select_status = false;

  //   if (event.shiftKey) {
  //     let last =
  //       dataVerificationCtrl.selectRange[
  //         dataVerificationCtrl.selectRange.length - 1
  //       ];

  //     let top = 0,
  //       height = 0,
  //       rowseleted = [];
  //     if (last.top > row_pre) {
  //       top = row_pre;
  //       height = last.top + last.height - row_pre;

  //       if (last.row[1] > last.row_focus) {
  //         last.row[1] = last.row_focus;
  //       }

  //       rowseleted = [row_index, last.row[1]];
  //     } else if (last.top == row_pre) {
  //       top = row_pre;
  //       height = last.top + last.height - row_pre;
  //       rowseleted = [row_index, last.row[0]];
  //     } else {
  //       top = last.top;
  //       height = row - last.top - 1;

  //       if (last.row[0] < last.row_focus) {
  //         last.row[0] = last.row_focus;
  //       }

  //       rowseleted = [last.row[0], row_index];
  //     }

  //     let left = 0,
  //       width = 0,
  //       columnseleted = [];
  //     if (last.left > col_pre) {
  //       left = col_pre;
  //       width = last.left + last.width - col_pre;

  //       if (last.column[1] > last.column_focus) {
  //         last.column[1] = last.column_focus;
  //       }

  //       columnseleted = [col_index, last.column[1]];
  //     } else if (last.left == col_pre) {
  //       left = col_pre;
  //       width = last.left + last.width - col_pre;
  //       columnseleted = [col_index, last.column[0]];
  //     } else {
  //       left = last.left;
  //       width = col - last.left - 1;

  //       if (last.column[0] < last.column_focus) {
  //         last.column[0] = last.column_focus;
  //       }

  //       columnseleted = [last.column[0], col_index];
  //     }

  //     let changeparam = menuButton.mergeMoveMain(
  //       columnseleted,
  //       rowseleted,
  //       last,
  //       top,
  //       height,
  //       left,
  //       width
  //     );
  //     if (changeparam != null) {
  //       columnseleted = changeparam[0];
  //       rowseleted = changeparam[1];
  //       top = changeparam[2];
  //       height = changeparam[3];
  //       left = changeparam[4];
  //       width = changeparam[5];
  //     }

  //     last["row"] = rowseleted;
  //     last["column"] = columnseleted;

  //     last["left_move"] = left;
  //     last["width_move"] = width;
  //     last["top_move"] = top;
  //     last["height_move"] = height;

  //     dataVerificationCtrl.selectRange[
  //       dataVerificationCtrl.selectRange.length - 1
  //     ] = last;
  //   } else {
  //     dataVerificationCtrl.selectRange = [];
  //     dataVerificationCtrl.selectRange.push({
  //       left: col_pre,
  //       width: col - col_pre - 1,
  //       top: row_pre,
  //       height: row - row_pre - 1,
  //       left_move: col_pre,
  //       width_move: col - col_pre - 1,
  //       top_move: row_pre,
  //       height_move: row - row_pre - 1,
  //       row: [row_index, row_index_ed],
  //       column: [col_index, col_index_ed],
  //       row_focus: row_index,
  //       column_focus: col_index,
  //     });
  //   }

  //   selectionCopyShow(dataVerificationCtrl.selectRange);

  //   let range = dataVerificationCtrl.getTxtByRange(
  //     dataVerificationCtrl.selectRange
  //   );
  //   if (formula.rangetosheet != ctx.currentSheetIndex) {
  //     range =
  //       ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].name +
  //       "!" +
  //       range;
  //   }
  //   $("#luckysheet-dataVerificationRange-dialog input").val(range);

  //   return;
  // } else {
  //   dataVerificationCtrl.selectStatus = false;
  //   dataVerificationCtrl.selectRange = [];
  // }

  // //if公式生成器
  // if (ifFormulaGenerator.singleRangeFocus) {
  //   $("#luckysheet-ifFormulaGenerator-dialog .singRange").click();
  // }
  // if (
  //   $("#luckysheet-ifFormulaGenerator-singleRange-dialog").is(":visible")
  // ) {
  //   //选择单个单元格
  //   ctx.luckysheet_select_status = false;
  //   formula.rangestart = false;

  //   $("#luckysheet-formula-functionrange-select")
  //     .css({
  //       left: col_pre,
  //       width: col - col_pre - 1,
  //       top: row_pre,
  //       height: row - row_pre - 1,
  //     })
  //     .show();
  //   $("#luckysheet-formula-help-c").hide();

  //   let range = getRangetxt(
  //     ctx.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     ctx.currentSheetIndex
  //   );
  //   $("#luckysheet-ifFormulaGenerator-singleRange-dialog input").val(range);

  //   return;
  // }
  // if (
  //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
  // ) {
  //   //选择范围
  //   ctx.luckysheet_select_status = false;
  //   formula.func_selectedrange = {
  //     left: col_pre,
  //     width: col - col_pre - 1,
  //     top: row_pre,
  //     height: row - row_pre - 1,
  //     left_move: col_pre,
  //     width_move: col - col_pre - 1,
  //     top_move: row_pre,
  //     height_move: row - row_pre - 1,
  //     row: [row_index, row_index],
  //     column: [col_index, col_index],
  //     row_focus: row_index,
  //     column_focus: col_index,
  //   };
  //   formula.rangestart = true;

  //   $("#luckysheet-formula-functionrange-select")
  //     .css({
  //       left: col_pre,
  //       width: col - col_pre - 1,
  //       top: row_pre,
  //       height: row - row_pre - 1,
  //     })
  //     .show();
  //   $("#luckysheet-formula-help-c").hide();

  //   let range = getRangetxt(
  //     ctx.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     ctx.currentSheetIndex
  //   );
  //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);

  //   $("#luckysheet-row-count-show").hide();
  //   $("#luckysheet-column-count-show").hide();

  //   return;
  // }

  if (ctx.luckysheet_select_status) {
    if (e.shiftKey) {
      // 按住shift点击，选择范围
      const last =
        ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]; // 选区最后一个
      if (
        last &&
        last.top != null &&
        last.left != null &&
        last.height != null &&
        last.width != null &&
        last.row_focus != null &&
        last.column_focus != null
      ) {
        let top = 0;
        let height = 0;
        let rowseleted = [];
        if (last.top > row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;
          if (last.row[1] > last.row_focus) {
            last.row[1] = last.row_focus;
          }
          rowseleted = [row_index, last.row[1]];
        } else if (last.top === row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;
          rowseleted = [row_index, last.row[0]];
        } else {
          top = last.top;
          height = row - last.top - 1;
          if (last.row[0] < last.row_focus) {
            last.row[0] = last.row_focus;
          }
          rowseleted = [last.row[0], row_index];
        }
        let left = 0;
        let width = 0;
        let columnseleted = [];
        if (last.left > col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;
          if (last.column[1] > last.column_focus) {
            last.column[1] = last.column_focus;
          }
          columnseleted = [col_index, last.column[1]];
        } else if (last.left === col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;
          columnseleted = [col_index, last.column[0]];
        } else {
          left = last.left;
          width = col - last.left - 1;
          if (last.column[0] < last.column_focus) {
            last.column[0] = last.column_focus;
          }
          columnseleted = [last.column[0], col_index];
        }
        const changeparam = mergeMoveMain(
          ctx,
          columnseleted,
          rowseleted,
          last,
          top,
          height,
          left,
          width
        );
        if (changeparam != null) {
          // @ts-ignore
          [columnseleted, rowseleted, top, height, left, width] = changeparam;
        }
        last.row = rowseleted;
        last.column = columnseleted;
        last.left_move = left;
        last.width_move = width;
        last.top_move = top;
        last.height_move = height;
        ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1] =
          last;
        // // 交替颜色选择范围
        // if ($("#luckysheet-alternateformat-rangeDialog").is(":visible")) {
        //   $("#luckysheet-alternateformat-rangeDialog input").val(
        //     getRangetxt(ctx.currentSheetIndex, ctx.luckysheet_select_save)
        //   );
        // }
        // if (pivotTable.luckysheet_pivotTable_select_state) {
        //   $("#luckysheet-pivotTable-range-selection-input").val(
        //     `${
        //       ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)]
        //         .name
        //     }!${chatatABC(ctx.luckysheet_select_save[0].column[0])}${
        //       ctx.luckysheet_select_save[0].row[0] + 1
        //     }:${chatatABC(ctx.luckysheet_select_save[0].column[1])}${
        //       ctx.luckysheet_select_save[0].row[1] + 1
        //     }`
        //   );
      }
    } else if (e.ctrlKey || e.metaKey) {
      // 选区添加
      ctx.luckysheet_select_save?.push({
        left: col_pre,
        width: col - col_pre - 1,
        top: row_pre,
        height: row - row_pre - 1,
        left_move: col_pre,
        width_move: col - col_pre - 1,
        top_move: row_pre,
        height_move: row - row_pre - 1,
        row: [row_index, row_index_ed],
        column: [col_index, col_index_ed],
        row_focus: row_index,
        column_focus: col_index,
      });
    } else {
      // eslint-disable-next-line prefer-const
      ctx.luckysheet_select_save = [
        {
          left: col_pre,
          width: col - col_pre - 1,
          top: row_pre,
          height: row - row_pre - 1,
          left_move: col_pre,
          width_move: col - col_pre - 1,
          top_move: row_pre,
          height_move: row - row_pre - 1,
          row: [row_index, row_index_ed],
          column: [col_index, col_index_ed],
          row_focus: row_index,
          column_focus: col_index,
        },
      ];

      // 单元格格式icon对应
      //   menuButton.menuButtonFocus(ctx.flowdata, row_index, col_index);
      //   // 函数公式显示栏
      //   formula.fucntionboxshow(row_index, col_index);
    }
  }

  // selectHightlightShow();

  //   if (
  //     luckysheetFreezen.freezenhorizontaldata != null ||
  //     luckysheetFreezen.freezenverticaldata != null
  //   ) {
  //     luckysheetFreezen.scrollAdaptOfselect();
  //   }

  //   if (!browser.mobilecheck()) {
  //     // 非移动端聚焦输入框
  //     luckysheetactiveCell();
  //   }

  //   // 允许编辑后的后台更新时
  //   server.saveParam(
  //     "mv",
  //     ctx.currentSheetIndex,
  //     ctx.luckysheet_select_save
  //   );
  // }

  // // 交替颜色
  // if (alternateformat.rangefocus) {
  //   alternateformat.rangefocus = false;
  //   $("#luckysheet-alternateformat-range .fa-table").click();
  // }

  // $("#luckysheet-row-count-show, #luckysheet-column-count-show").hide();

  // if (!isEditMode()) {
  //   // chartMix 隐藏当前页的数据选择区域高亮
  //   hideAllNeedRangeShow();
  // }

  // // selectHelpboxFill();

  // // 数据透视表
  // pivotTable.pivotclick(row_index, col_index, ctx.currentSheetIndex);

  // luckysheetContainerFocus();

  // method.createHookFunction(
  //   "cellMousedown",
  //   ctx.flowdata[row_index][col_index],
  //   {
  //     r: row_index,
  //     c: col_index,
  //     start_r: row_pre,
  //     start_c: col_pre,
  //     end_r: row,
  //     end_c: col,
  //   },
  //   sheetFile,
  //   luckysheetTableContent
  // );
  ctx.luckysheet_select_save = normalizeSelection(
    ctx,
    ctx.luckysheet_select_save
  );
}

export function handleCellAreaDoubleClick(
  ctx: Context,
  globalCache: GlobalCache,
  settings: Settings,
  e: MouseEvent,
  container: HTMLElement
) {
  // if ($(event.target).hasClass("luckysheet-mousedown-cancel")) {
  //   return;
  // }
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  if (
    (ctx.luckysheetCellUpdate.length > 0 && formulaCache.rangestart) ||
    formulaCache.rangedrag_column_start ||
    formulaCache.rangedrag_row_start ||
    israngeseleciton()
  ) {
    return;
  }
  // 禁止前台编辑(只可 框选单元格、滚动查看表格)
  if (!settings.allowEdit) {
    return;
  }

  // if (parseInt($("#luckysheet-input-box").css("top")) > 0) {
  //   return;
  // }

  // const mouse = mouseposition(event.pageX, event.pageY);
  // if (
  //   mouse[0] >= ctx.cellmainWidth - ctx.cellMainSrollBarSize ||
  //   mouse[1] >= ctx.cellmainHeight - ctx.cellMainSrollBarSize
  // ) {
  //   return;
  // }

  // const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  // const scrollTop = $("#luckysheet-cell-main").scrollTop();
  // let x = mouse[0] + scrollLeft;
  // let y = mouse[1] + scrollTop;
  const rect = container.getBoundingClientRect();
  const mouseX = e.pageX - rect.left;
  const mouseY = e.pageY - rect.top;
  let x = mouseX + ctx.scrollLeft;
  let y = mouseY + ctx.scrollTop;

  const freeze = globalCache.freezen?.[ctx.currentSheetIndex];
  [x, y] = fixPositionOnFrozenCells(freeze, x, y, mouseX, mouseY);

  const row_location = rowLocation(y, ctx.visibledatarow);
  let row_index = row_location[2];

  const col_location = colLocation(x, ctx.visibledatacolumn);
  let col_index = col_location[2];

  const margeset = mergeBorder(ctx, flowdata, row_index, col_index);
  if (margeset) {
    [, , row_index] = margeset.row;
    [, , col_index] = margeset.column;
  }

  /*
        if (pivotTable.isPivotRange(row_index, col_index)) {
          // 数据透视表没有 任何数据
          if (
            (pivotTable.filter == null || pivotTable.filter.length == 0) &&
            (pivotTable.row == null || pivotTable.row.length == 0) &&
            (pivotTable.column == null || pivotTable.column.length == 0) &&
            (pivotTable.values == null || pivotTable.values.length == 0)
          ) {
            return;
          }
  
          // 数据透视表没有 数值数据
          if (pivotTable.values == null || pivotTable.values.length == 0) {
            return;
          }
  
          // 点击位置不是 数值数据 所在区域
          if (row_index == 0 || col_index == 0) {
            return;
          }
  
          if (pivotTable.column != null && pivotTable.column.length > 0) {
            if (
              pivotTable.values.length >= 2 &&
              pivotTable.showType == "column"
            ) {
              if (
                row_index <= pivotTable.column.length ||
                col_index >=
                  pivotTable.pivotDatas[0].length - pivotTable.values.length
              ) {
                return;
              }
            } else {
              if (
                row_index <= pivotTable.column.length - 1 ||
                col_index >= pivotTable.pivotDatas[0].length - 1
              ) {
                return;
              }
            }
          }
  
          if (pivotTable.row != null && pivotTable.row.length > 0) {
            if (pivotTable.values.length >= 2 && pivotTable.showType == "row") {
              if (
                col_index <= pivotTable.row.length ||
                row_index >=
                  pivotTable.pivotDatas.length - pivotTable.values.length
              ) {
                return;
              }
            } else {
              if (
                col_index <= pivotTable.row.length - 1 ||
                row_index >= pivotTable.pivotDatas.length - 1
              ) {
                return;
              }
            }
          }
  
          sheetmanage.addNewSheet(event);
  
          pivotTable.drillDown(row_index, col_index);
          return;
        }
        */

  // if (
  //   $("#luckysheet-search-formula-parm").is(":visible") ||
  //   $("#luckysheet-search-formula-parm-select").is(":visible")
  // ) {
  //   // 公式参数栏显示
  //   $("#luckysheet-cell-selected").hide();
  // } else if (
  //   $("#luckysheet-conditionformat-dialog").is(":visible") ||
  //   $("#luckysheet-administerRule-dialog").is(":visible") ||
  //   $("#luckysheet-newConditionRule-dialog").is(":visible") ||
  //   $("#luckysheet-editorConditionRule-dialog").is(":visible") ||
  //   $("#luckysheet-singleRange-dialog").is(":visible") ||
  //   $("#luckysheet-multiRange-dialog").is(":visible")
  // ) {
  //   // 条件格式
  // } else if (
  //   $("#luckysheet-modal-dialog-slider-alternateformat").is(":visible") ||
  //   $("#luckysheet-alternateformat-rangeDialog").is(":visible")
  // ) {
  //   // 交替颜色
  // } else {
  //   if (menuButton.luckysheetPaintModelOn) {
  //     menuButton.cancelPaintModel();
  //   }

  // 检查当前坐标和焦点坐标是否一致，如果不一致那么进行修正
  const { column_focus, row_focus } = ctx.luckysheet_select_save![0];
  if (
    !_.isNil(column_focus) &&
    !_.isNil(row_focus) &&
    (column_focus !== col_index || row_focus !== row_index)
  ) {
    row_index = row_focus;
    col_index = column_focus;
  }

  luckysheetUpdateCell(ctx, row_index, col_index);
  // }
}

export function handleContextMenu(
  ctx: Context,
  settings: Settings,
  e: MouseEvent,
  workbookContainer: HTMLDivElement
) {
  if (!ctx.allowEdit) {
    return;
  }
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  // if (isEditMode()) {
  //   //非编辑模式下禁止右键功能框
  //   return;
  // }
  const workbookRect = workbookContainer.getBoundingClientRect();

  if ((ctx.luckysheet_select_save?.length ?? 0) === 0) {
    return;
  }

  const { cellContextMenu } = settings;

  // $("#luckysheet-cols-rows-data").show();
  // $("#luckysheet-cols-rows-handleincell").show();
  // $("#luckysheet-cols-rows-add, #luckysheet-cols-rows-shift").hide();

  // $$("#luckysheet-cols-rows-data .luckysheet-menuseparator").style.display =
  //   "block";
  // $$(
  //   "#luckysheet-cols-rows-handleincell .luckysheet-menuseparator"
  // ).style.display = "block";

  // 如果全部按钮都隐藏，则整个菜单容器也要隐藏
  if (_.isEmpty(cellContextMenu)) {
    return;
  }

  // relative to the workbook container
  const x = e.pageX - workbookRect.left;
  const y = e.pageY - workbookRect.top;

  // showrightclickmenu($("#luckysheet-rightclick-menu"), x, y);
  ctx.contextMenu = {
    x,
    y,
    pageX: e.pageX,
    pageY: e.pageY,
  };

  e.preventDefault();
}

function mouseRender(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  scrollX: HTMLDivElement,
  scrollY: HTMLDivElement,
  container: HTMLDivElement
) {
  const rect = container.getBoundingClientRect();
  if (
    ctx.luckysheet_scroll_status &&
    !ctx.luckysheet_cols_change_size &&
    !ctx.luckysheet_rows_change_size
  ) {
    const left = ctx.scrollLeft;
    const top = ctx.scrollTop;
    const x = e.pageX - rect.left;
    const y = e.pageY - rect.top;
    const winH = rect.height - 20 * ctx.zoomRatio;
    const winW = rect.width - 60 * ctx.zoomRatio;

    if (y < 0 || y > winH) {
      let stop;
      if (y < 0) {
        stop = top + y / 2;
      } else {
        stop = top + (y - winH) / 2;
      }
      scrollY.scrollTop = stop;
    }

    if (x < 0 || x > winW) {
      let sleft;
      if (x < 0) {
        sleft = left + x / 2;
      } else {
        sleft = left + (x - winW) / 2;
      }

      scrollX.scrollLeft = sleft;
    }
  }
  // 拖动选择
  if (ctx.luckysheet_select_status) {
    const x = e.pageX - rect.left - ctx.rowHeaderWidth + ctx.scrollLeft;
    const y = e.pageY - rect.top - ctx.columnHeaderHeight + ctx.scrollTop;

    const row_location = rowLocation(y, ctx.visibledatarow);
    const row = row_location[1];
    const row_pre = row_location[0];
    const row_index = row_location[2];
    const col_location = colLocation(x, ctx.visibledatacolumn);
    const col = col_location[1];
    const col_pre = col_location[0];
    const col_index = col_location[2];

    if (
      !checkProtectionSelectLockedOrUnLockedCells(
        ctx,
        row_index,
        col_index,
        ctx.currentSheetIndex
      )
    ) {
      ctx.luckysheet_select_status = false;
      return;
    }

    const last = _.cloneDeep(
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]
    );

    if (
      !last ||
      _.isNil(last.left) ||
      _.isNil(last.top) ||
      _.isNil(last.height) ||
      _.isNil(last.width) ||
      _.isNil(last.row_focus) ||
      _.isNil(last.column_focus)
    ) {
      return;
    }

    let top = 0;
    let height = 0;
    let rowseleted = [];
    if (last.top > row_pre) {
      top = row_pre;
      height = last.top + last.height - row_pre;

      if (last.row[1] > last.row_focus) {
        last.row[1] = last.row_focus;
      }

      rowseleted = [row_index, last.row[1]];
    } else if (last.top === row_pre) {
      top = row_pre;
      height = last.top + last.height - row_pre;
      rowseleted = [row_index, last.row[0]];
    } else {
      top = last.top;
      height = row - last.top - 1;

      if (last.row[0] < last.row_focus) {
        last.row[0] = last.row_focus;
      }

      rowseleted = [last.row[0], row_index];
    }

    let left = 0;
    let width = 0;
    let columnseleted = [];
    if (last.left > col_pre) {
      left = col_pre;
      width = last.left + last.width - col_pre;

      if (last.column[1] > last.column_focus) {
        last.column[1] = last.column_focus;
      }

      columnseleted = [col_index, last.column[1]];
    } else if (last.left === col_pre) {
      left = col_pre;
      width = last.left + last.width - col_pre;
      columnseleted = [col_index, last.column[0]];
    } else {
      left = last.left;
      width = col - last.left - 1;

      if (last.column[0] < last.column_focus) {
        last.column[0] = last.column_focus;
      }

      columnseleted = [last.column[0], col_index];
    }

    const changeparam = mergeMoveMain(
      ctx,
      columnseleted,
      rowseleted,
      last,
      top,
      height,
      left,
      width
    );
    if (changeparam != null) {
      // @ts-ignore
      [columnseleted, rowseleted, top, height, left, width] = changeparam;
    }

    last.row = rowseleted;
    last.column = columnseleted;

    last.left_move = left;
    last.width_move = width;
    last.top_move = top;
    last.height_move = height;

    ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1] = last;

    scrollToFrozenRowCol(ctx, globalCache.freezen?.[ctx.currentSheetIndex]);
    // luckysheetFreezen.scrollFreezen();

    // selectHelpboxFill();

    // 交替颜色选择范围
    // if ($("#luckysheet-alternateformat-rangeDialog").is(":visible")) {
    //   $("#luckysheet-alternateformat-rangeDialog input").val(
    //     getRangetxt(
    //       ctx.currentSheetIndex,
    //       ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1]
    //     )
    //   );
    // }

    // if (pivotTable.luckysheet_pivotTable_select_state) {
    //   $("#luckysheet-pivotTable-range-selection-input").val(
    //     `${
    //       ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].name
    //     }!${chatatABC(ctx.luckysheet_select_save[0].column[0])}${
    //       ctx.luckysheet_select_save[0].row[0] + 1
    //     }:${chatatABC(ctx.luckysheet_select_save[0].column[1])}${
    //       ctx.luckysheet_select_save[0].row[1] + 1
    //     }`
    //   );
    // }
    // } else if (conditionformat.selectStatus) {
    //   const mouse = mouseposition(event.pageX, event.pageY);
    //   const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
    //   const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();

    //   const row_location = rowLocation(y);
    //   const row = row_location[1];
    //   const row_pre = row_location[0];
    //   const row_index = row_location[2];
    //   const col_location = colLocation(x);
    //   const col = col_location[1];
    //   const col_pre = col_location[0];
    //   const col_index = col_location[2];

    //   const last =
    //     conditionformat.selectRange[conditionformat.selectRange.length - 1];

    //   let top = 0;
    //   let height = 0;
    //   let rowseleted = [];
    //   if (last.top > row_pre) {
    //     top = row_pre;
    //     height = last.top + last.height - row_pre;

    //     if (last.row[1] > last.row_focus) {
    //       last.row[1] = last.row_focus;
    //     }

    //     rowseleted = [row_index, last.row[1]];
    //   } else if (last.top == row_pre) {
    //     top = row_pre;
    //     height = last.top + last.height - row_pre;
    //     rowseleted = [row_index, last.row[0]];
    //   } else {
    //     top = last.top;
    //     height = row - last.top - 1;

    //     if (last.row[0] < last.row_focus) {
    //       last.row[0] = last.row_focus;
    //     }

    //     rowseleted = [last.row[0], row_index];
    //   }

    //   let left = 0;
    //   let width = 0;
    //   let columnseleted = [];
    //   if (last.left > col_pre) {
    //     left = col_pre;
    //     width = last.left + last.width - col_pre;

    //     if (last.column[1] > last.column_focus) {
    //       last.column[1] = last.column_focus;
    //     }

    //     columnseleted = [col_index, last.column[1]];
    //   } else if (last.left == col_pre) {
    //     left = col_pre;
    //     width = last.left + last.width - col_pre;
    //     columnseleted = [col_index, last.column[0]];
    //   } else {
    //     left = last.left;
    //     width = col - last.left - 1;

    //     if (last.column[0] < last.column_focus) {
    //       last.column[0] = last.column_focus;
    //     }

    //     columnseleted = [last.column[0], col_index];
    //   }

    //   const changeparam = menuButton.mergeMoveMain(
    //     columnseleted,
    //     rowseleted,
    //     last,
    //     top,
    //     height,
    //     left,
    //     width
    //   );
    //   if (changeparam != null) {
    //     columnseleted = changeparam[0];
    //     rowseleted = changeparam[1];
    //     top = changeparam[2];
    //     height = changeparam[3];
    //     left = changeparam[4];
    //     width = changeparam[5];
    //   }

    //   last.row = rowseleted;
    //   last.column = columnseleted;

    //   last.left_move = left;
    //   last.width_move = width;
    //   last.top_move = top;
    //   last.height_move = height;

    //   conditionformat.selectRange[conditionformat.selectRange.length - 1] = last;

    //   selectionCopyShow(conditionformat.selectRange);

    //   const range = conditionformat.getTxtByRange(conditionformat.selectRange);
    //   $("#luckysheet-multiRange-dialog input").val(range);
    // } else if (dataVerificationCtrl.selectStatus) {
    //   const mouse = mouseposition(event.pageX, event.pageY);
    //   const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
    //   const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();

    //   const row_location = rowLocation(y);
    //   const row = row_location[1];
    //   const row_pre = row_location[0];
    //   const row_index = row_location[2];
    //   const col_location = colLocation(x);
    //   const col = col_location[1];
    //   const col_pre = col_location[0];
    //   const col_index = col_location[2];

    //   const last =
    //     dataVerificationCtrl.selectRange[
    //       dataVerificationCtrl.selectRange.length - 1
    //     ];

    //   let top = 0;
    //   let height = 0;
    //   let rowseleted = [];
    //   if (last.top > row_pre) {
    //     top = row_pre;
    //     height = last.top + last.height - row_pre;

    //     if (last.row[1] > last.row_focus) {
    //       last.row[1] = last.row_focus;
    //     }

    //     rowseleted = [row_index, last.row[1]];
    //   } else if (last.top == row_pre) {
    //     top = row_pre;
    //     height = last.top + last.height - row_pre;
    //     rowseleted = [row_index, last.row[0]];
    //   } else {
    //     top = last.top;
    //     height = row - last.top - 1;

    //     if (last.row[0] < last.row_focus) {
    //       last.row[0] = last.row_focus;
    //     }

    //     rowseleted = [last.row[0], row_index];
    //   }

    //   let left = 0;
    //   let width = 0;
    //   let columnseleted = [];
    //   if (last.left > col_pre) {
    //     left = col_pre;
    //     width = last.left + last.width - col_pre;

    //     if (last.column[1] > last.column_focus) {
    //       last.column[1] = last.column_focus;
    //     }

    //     columnseleted = [col_index, last.column[1]];
    //   } else if (last.left == col_pre) {
    //     left = col_pre;
    //     width = last.left + last.width - col_pre;
    //     columnseleted = [col_index, last.column[0]];
    //   } else {
    //     left = last.left;
    //     width = col - last.left - 1;

    //     if (last.column[0] < last.column_focus) {
    //       last.column[0] = last.column_focus;
    //     }

    //     columnseleted = [last.column[0], col_index];
    //   }

    //   const changeparam = menuButton.mergeMoveMain(
    //     columnseleted,
    //     rowseleted,
    //     last,
    //     top,
    //     height,
    //     left,
    //     width
    //   );
    //   if (changeparam != null) {
    //     columnseleted = changeparam[0];
    //     rowseleted = changeparam[1];
    //     top = changeparam[2];
    //     height = changeparam[3];
    //     left = changeparam[4];
    //     width = changeparam[5];
    //   }

    //   last.row = rowseleted;
    //   last.column = columnseleted;

    //   last.left_move = left;
    //   last.width_move = width;
    //   last.top_move = top;
    //   last.height_move = height;

    //   dataVerificationCtrl.selectRange[
    //     dataVerificationCtrl.selectRange.length - 1
    //   ] = last;

    //   selectionCopyShow(dataVerificationCtrl.selectRange);

    //   let range = dataVerificationCtrl.getTxtByRange(
    //     dataVerificationCtrl.selectRange
    //   );
    //   if (formula.rangetosheet != ctx.currentSheetIndex) {
    //     range = `${
    //       ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].name
    //     }!${range}`;
    //   }
    //   $("#luckysheet-dataVerificationRange-dialog input").val(range);
  } else if (formulaCache.rangestart) {
    rangeDrag(
      ctx,
      e,
      cellInput,
      scrollX.scrollLeft,
      scrollY.scrollTop,
      container
    );
    // } else if (formula.rangedrag_row_start) {
    //   formula.rangedrag_row(event);
    // } else if (formula.rangedrag_column_start) {
    //   formula.rangedrag_column(event);
  } else if (ctx.luckysheet_rows_selected_status) {
    // const mouse = mouseposition(event.pageX, event.pageY);
    // const y = mouse[1] + $("#luckysheet-rows-h").scrollTop();
    // if (y < 0) {
    //   return false;
    // }
    // const row_location = rowLocation(y);
    // const row = row_location[1];
    // const row_pre = row_location[0];
    // const row_index = row_location[2];
    // const col_index = ctx.visibledatacolumn.length - 1;
    // const col = ctx.visibledatacolumn[col_index];
    // const col_pre = 0;
    // const last = $.extend(
    //   true,
    //   {},
    //   ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1]
    // );
    // let top = 0;
    // let height = 0;
    // let rowseleted = [];
    // if (last.top > row_pre) {
    //   top = row_pre;
    //   height = last.top + last.height - row_pre;
    //   if (last.row[1] > last.row_focus) {
    //     last.row[1] = last.row_focus;
    //   }
    //   rowseleted = [row_index, last.row[1]];
    // } else if (last.top == row_pre) {
    //   top = row_pre;
    //   height = last.top + last.height - row_pre;
    //   rowseleted = [row_index, last.row[0]];
    // } else {
    //   top = last.top;
    //   height = row - last.top - 1;
    //   if (last.row[0] < last.row_focus) {
    //     last.row[0] = last.row_focus;
    //   }
    //   rowseleted = [last.row[0], row_index];
    // }
    // last.row = rowseleted;
    // last.top_move = top;
    // last.height_move = height;
    // ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] = last;
    // selectHightlightShow();
    // clearTimeout(ctx.countfuncTimeout);
    // ctx.countfuncTimeout = setTimeout(function () {
    //   countfunc();
    // }, 500);
  } else if (ctx.luckysheet_cols_selected_status) {
    // const mouse = mouseposition(event.pageX, event.pageY);
    // const x = mouse[0] + $("#luckysheet-cols-h-c").scrollLeft();
    // if (x < 0) {
    //   return false;
    // }
    // const row_index = ctx.visibledatarow.length - 1;
    // const row = ctx.visibledatarow[row_index];
    // const row_pre = 0;
    // const col_location = colLocation(x);
    // const col = col_location[1];
    // const col_pre = col_location[0];
    // const col_index = col_location[2];
    // const last = $.extend(
    //   true,
    //   {},
    //   ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1]
    // );
    // let left = 0;
    // let width = 0;
    // let columnseleted = [];
    // if (last.left > col_pre) {
    //   left = col_pre;
    //   width = last.left + last.width - col_pre;
    //   if (last.column[1] > last.column_focus) {
    //     last.column[1] = last.column_focus;
    //   }
    //   columnseleted = [col_index, last.column[1]];
    // } else if (last.left == col_pre) {
    //   left = col_pre;
    //   width = last.left + last.width - col_pre;
    //   columnseleted = [col_index, last.column[0]];
    // } else {
    //   left = last.left;
    //   width = col - last.left - 1;
    //   if (last.column[0] < last.column_focus) {
    //     last.column[0] = last.column_focus;
    //   }
    //   columnseleted = [last.column[0], col_index];
    // }
    // last.column = columnseleted;
    // last.left_move = left;
    // last.width_move = width;
    // ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1] = last;
    // selectHightlightShow();
    // clearTimeout(ctx.countfuncTimeout);
    // ctx.countfuncTimeout = setTimeout(function () {
    //   countfunc();
    // }, 500);
  } else if (ctx.luckysheet_cell_selected_move) {
    /*
      const mouse = mouseposition(event.pageX, event.pageY);
  
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      const scrollTop = $("#luckysheet-cell-main").scrollTop();
  
      const x = mouse[0] + scrollLeft;
      const y = mouse[1] + scrollTop;
  
      const winH =
        $(window).height() +
        scrollTop -
        ctx.sheetBarHeight -
        ctx.statisticBarHeight;
      const winW = $(window).width() + scrollLeft;
  
      const row_location = rowLocation(y, ctx.visibledatarow);
      let row = row_location[1];
      let row_pre = row_location[0];
      const row_index = row_location[2];
      const col_location = colLocation(x, ctx.visibledatarow);
      let col = col_location[1];
      let col_pre = col_location[0];
      const col_index = col_location[2];
  
      const row_index_original = ctx.luckysheet_cell_selected_move_index[0];
      const col_index_original = ctx.luckysheet_cell_selected_move_index[1];
  
      let row_s =
        ctx.luckysheet_select_save[0].row[0] - row_index_original + row_index;
      let row_e =
        ctx.luckysheet_select_save[0].row[1] - row_index_original + row_index;
  
      let col_s =
        ctx.luckysheet_select_save[0].column[0] - col_index_original + col_index;
      let col_e =
        ctx.luckysheet_select_save[0].column[1] - col_index_original + col_index;
  
      if (row_s < 0 || y < 0) {
        row_s = 0;
        row_e =
          ctx.luckysheet_select_save[0].row[1] -
          ctx.luckysheet_select_save[0].row[0];
      }
  
      if (col_s < 0 || x < 0) {
        col_s = 0;
        col_e =
          ctx.luckysheet_select_save[0].column[1] -
          ctx.luckysheet_select_save[0].column[0];
      }
  
      if (
        row_e >= ctx.visibledatarow[ctx.visibledatarow.length - 1] ||
        y > winH
      ) {
        row_s =
          ctx.visibledatarow.length -
          1 -
          ctx.luckysheet_select_save[0].row[1] +
          ctx.luckysheet_select_save[0].row[0];
        row_e = ctx.visibledatarow.length - 1;
      }
  
      if (
        col_e >= ctx.visibledatacolumn[ctx.visibledatacolumn.length - 1] ||
        x > winW
      ) {
        col_s =
          ctx.visibledatacolumn.length -
          1 -
          ctx.luckysheet_select_save[0].column[1] +
          ctx.luckysheet_select_save[0].column[0];
        col_e = ctx.visibledatacolumn.length - 1;
      }
  
      col_pre = col_s - 1 == -1 ? 0 : ctx.visibledatacolumn[col_s - 1];
      col = ctx.visibledatacolumn[col_e];
      row_pre = row_s - 1 == -1 ? 0 : ctx.visibledatarow[row_s - 1];
      row = ctx.visibledatarow[row_e];
  
      $("#luckysheet-cell-selected-move").css({
        left: col_pre,
        width: col - col_pre - 2,
        top: row_pre,
        height: row - row_pre - 2,
        display: "block",
      });
      */
  } else if (ctx.luckysheet_cell_selected_extend) {
    /*
      const mouse = mouseposition(event.pageX, event.pageY);
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft() - 5;
      const scrollTop = $("#luckysheet-cell-main").scrollTop() - 5;
  
      const x = mouse[0] + scrollLeft;
      const y = mouse[1] + scrollTop;
  
      const winH =
        $(window).height() +
        scrollTop -
        ctx.sheetBarHeight -
        ctx.statisticBarHeight;
      const winW = $(window).width() + scrollLeft;
  
      const row_location = rowLocation(y);
      const row = row_location[1];
      const row_pre = row_location[0];
      const row_index = row_location[2];
      const col_location = colLocation(x);
      const col = col_location[1];
      const col_pre = col_location[0];
      const col_index = col_location[2];
  
      const row_index_original = ctx.luckysheet_cell_selected_extend_index[0];
      const col_index_original = ctx.luckysheet_cell_selected_extend_index[1];
  
      let row_s = ctx.luckysheet_select_save[0].row[0];
      let row_e = ctx.luckysheet_select_save[0].row[1];
      let col_s = ctx.luckysheet_select_save[0].column[0];
      let col_e = ctx.luckysheet_select_save[0].column[1];
  
      if (row_s < 0 || y < 0) {
        row_s = 0;
        row_e =
          ctx.luckysheet_select_save[0].row[1] -
          ctx.luckysheet_select_save[0].row[0];
      }
  
      if (col_s < 0 || x < 0) {
        col_s = 0;
        col_e =
          ctx.luckysheet_select_save[0].column[1] -
          ctx.luckysheet_select_save[0].column[0];
      }
  
      if (
        row_e >= ctx.visibledatarow[ctx.visibledatarow.length - 1] ||
        y > winH
      ) {
        row_s =
          ctx.visibledatarow.length -
          1 -
          ctx.luckysheet_select_save[0].row[1] +
          ctx.luckysheet_select_save[0].row[0];
        row_e = ctx.visibledatarow.length - 1;
      }
  
      if (
        col_e >= ctx.visibledatacolumn[ctx.visibledatacolumn.length - 1] ||
        x > winW
      ) {
        col_s =
          ctx.visibledatacolumn.length -
          1 -
          ctx.luckysheet_select_save[0].column[1] +
          ctx.luckysheet_select_save[0].column[0];
        col_e = ctx.visibledatacolumn.length - 1;
      }
  
      let top = ctx.luckysheet_select_save[0].top_move;
      let height = ctx.luckysheet_select_save[0].height_move;
      let left = ctx.luckysheet_select_save[0].left_move;
      let width = ctx.luckysheet_select_save[0].width_move;
  
      if (
        Math.abs(row_index_original - row_index) >
        Math.abs(col_index_original - col_index)
      ) {
        if (!(row_index >= row_s && row_index <= row_e)) {
          if (ctx.luckysheet_select_save[0].top_move >= row_pre) {
            top = row_pre;
            height =
              ctx.luckysheet_select_save[0].top_move +
              ctx.luckysheet_select_save[0].height_move -
              row_pre;
          } else {
            top = ctx.luckysheet_select_save[0].top_move;
            height = row - ctx.luckysheet_select_save[0].top_move - 1;
          }
        }
      } else {
        if (!(col_index >= col_s && col_index <= col_e)) {
          if (ctx.luckysheet_select_save[0].left_move >= col_pre) {
            left = col_pre;
            width =
              ctx.luckysheet_select_save[0].left_move +
              ctx.luckysheet_select_save[0].width_move -
              col_pre;
          } else {
            left = ctx.luckysheet_select_save[0].left_move;
            width = col - ctx.luckysheet_select_save[0].left_move - 1;
          }
        }
      }
  
      $("#luckysheet-cell-selected-extend").css({
        left,
        width,
        top,
        height,
        display: "block",
      });
      */
  } else if (ctx.luckysheet_cols_change_size) {
    // 调整列宽拖动
    const x = e.pageX - rect.left - ctx.rowHeaderWidth + container.scrollLeft;
    if (
      x + 3 - ctx.luckysheet_cols_change_size_start[0] > 30 &&
      x < rect.width + ctx.scrollLeft - 100
    ) {
      const changeSizeLine = document.querySelector(
        ".luckysheet-change-size-line"
      );
      if (changeSizeLine) {
        (changeSizeLine as HTMLDivElement).style.left = `${x}px`;
      }
      const changeSizeCol = document.querySelector(
        ".luckysheet-cols-change-size"
      );
      if (changeSizeCol) {
        (changeSizeCol as HTMLDivElement).style.left = `${x - 2}px`;
      }
    }
  } else if (ctx.luckysheet_rows_change_size) {
    // 调整行高拖动
    const y = e.pageY - rect.top - ctx.columnHeaderHeight + container.scrollTop;
    if (
      y + 3 - ctx.luckysheet_rows_change_size_start[0] > 19 &&
      y < rect.height + ctx.scrollTop - 200
    ) {
      const changeSizeLine = document.querySelector(
        ".luckysheet-change-size-line"
      );
      if (changeSizeLine) {
        (changeSizeLine as HTMLDivElement).style.top = `${y}px`;
      }
      const changeSizeRow = document.querySelector(
        ".luckysheet-rows-change-size"
      );
      if (changeSizeRow) {
        (changeSizeRow as HTMLDivElement).style.top = `${y}px`;
      }
    }
  }
  /*
    // chart move
    else if (ctx.chartparam.luckysheetCurrentChartMove) {
      const mouse = mouseposition(event.pageX, event.pageY);
      const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
      const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();
  
      const myh = ctx.chartparam.luckysheetCurrentChartMoveObj.height();
      const myw = ctx.chartparam.luckysheetCurrentChartMoveObj.width();
      let top = y - ctx.chartparam.luckysheetCurrentChartMoveXy[1];
      let left = x - ctx.chartparam.luckysheetCurrentChartMoveXy[0];
  
      if (top < 0) {
        top = 0;
      }
  
      if (top + myh + 42 + 6 > ctx.chartparam.luckysheetCurrentChartMoveWinH) {
        top = ctx.chartparam.luckysheetCurrentChartMoveWinH - myh - 42 - 6;
      }
  
      if (left < 0) {
        left = 0;
      }
  
      if (left + myw + 22 + 36 > ctx.chartparam.luckysheetCurrentChartMoveWinW) {
        left = ctx.chartparam.luckysheetCurrentChartMoveWinW - myw - 22 - 36;
      }
  
      ctx.chartparam.luckysheetCurrentChartMoveObj.css({
        top,
        left,
      });
  
      if (
        luckysheetFreezen.freezenhorizontaldata != null ||
        luckysheetFreezen.freezenverticaldata != null
      ) {
        luckysheetFreezen.scrollAdapt();
  
        const toffset = ctx.chartparam.luckysheetCurrentChartMoveObj.offset();
        const tpsition = ctx.chartparam.luckysheetCurrentChartMoveObj.position();
        ctx.chartparam.luckysheetCurrentChartMoveXy = [
          event.pageX - toffset.left,
          event.pageY - toffset.top,
          tpsition.left,
          tpsition.top,
          $("#luckysheet-scrollbar-x").scrollLeft(),
          $("#luckysheet-scrollbar-y").scrollTop(),
        ];
      }
    }
    // chart resize
    else if (ctx.chartparam.luckysheetCurrentChartResize) {
      const scrollTop = $("#luckysheet-cell-main").scrollTop();
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      const mouse = mouseposition(event.pageX, event.pageY);
      const x = mouse[0] + scrollLeft;
      const y = mouse[1] + scrollTop;
  
      if (x < 0 || y < 0) {
        return false;
      }
  
      const myh = ctx.chartparam.luckysheetCurrentChartResizeObj.height();
      const myw = ctx.chartparam.luckysheetCurrentChartResizeObj.width();
      const topchange = y - ctx.chartparam.luckysheetCurrentChartResizeXy[1];
      const leftchange = x - ctx.chartparam.luckysheetCurrentChartResizeXy[0];
  
      let top = ctx.chartparam.luckysheetCurrentChartResizeXy[5];
      let height = ctx.chartparam.luckysheetCurrentChartResizeXy[3];
      let left = ctx.chartparam.luckysheetCurrentChartResizeXy[4];
      let width = ctx.chartparam.luckysheetCurrentChartResizeXy[2];
  
      if (
        ctx.chartparam.luckysheetCurrentChartResize == "lm" ||
        ctx.chartparam.luckysheetCurrentChartResize == "lt" ||
        ctx.chartparam.luckysheetCurrentChartResize == "lb"
      ) {
        left = x;
        width = ctx.chartparam.luckysheetCurrentChartResizeXy[2] - leftchange;
        if (
          left >
          ctx.chartparam.luckysheetCurrentChartResizeXy[2] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[4] -
            60
        ) {
          left =
            ctx.chartparam.luckysheetCurrentChartResizeXy[2] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[4] -
            60;
          width =
            ctx.chartparam.luckysheetCurrentChartResizeXy[2] -
            (ctx.chartparam.luckysheetCurrentChartResizeXy[2] +
              ctx.chartparam.luckysheetCurrentChartResizeXy[4] -
              60 -
              ctx.chartparam.luckysheetCurrentChartResizeXy[0]);
        } else if (left <= 0) {
          left = 0;
          width =
            ctx.chartparam.luckysheetCurrentChartResizeXy[2] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[0];
        }
      }
  
      if (
        ctx.chartparam.luckysheetCurrentChartResize == "rm" ||
        ctx.chartparam.luckysheetCurrentChartResize == "rt" ||
        ctx.chartparam.luckysheetCurrentChartResize == "rb"
      ) {
        width = ctx.chartparam.luckysheetCurrentChartResizeXy[2] + leftchange;
        if (width < 60) {
          width = 60;
        } else if (
          width >=
          ctx.chartparam.luckysheetCurrentChartResizeWinW -
            ctx.chartparam.luckysheetCurrentChartResizeXy[4] -
            22 -
            36
        ) {
          width =
            ctx.chartparam.luckysheetCurrentChartResizeWinW -
            ctx.chartparam.luckysheetCurrentChartResizeXy[4] -
            22 -
            36;
        }
      }
  
      if (
        ctx.chartparam.luckysheetCurrentChartResize == "mt" ||
        ctx.chartparam.luckysheetCurrentChartResize == "lt" ||
        ctx.chartparam.luckysheetCurrentChartResize == "rt"
      ) {
        top = y;
        height = ctx.chartparam.luckysheetCurrentChartResizeXy[3] - topchange;
        if (
          top >
          ctx.chartparam.luckysheetCurrentChartResizeXy[3] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[5] -
            60
        ) {
          top =
            ctx.chartparam.luckysheetCurrentChartResizeXy[3] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[5] -
            60;
          height =
            ctx.chartparam.luckysheetCurrentChartResizeXy[3] -
            (ctx.chartparam.luckysheetCurrentChartResizeXy[3] +
              ctx.chartparam.luckysheetCurrentChartResizeXy[5] -
              60 -
              ctx.chartparam.luckysheetCurrentChartResizeXy[1]);
        } else if (top <= 0) {
          top = 0;
          height =
            ctx.chartparam.luckysheetCurrentChartResizeXy[3] +
            ctx.chartparam.luckysheetCurrentChartResizeXy[1];
        }
      }
  
      if (
        ctx.chartparam.luckysheetCurrentChartResize == "mb" ||
        ctx.chartparam.luckysheetCurrentChartResize == "lb" ||
        ctx.chartparam.luckysheetCurrentChartResize == "rb"
      ) {
        height = ctx.chartparam.luckysheetCurrentChartResizeXy[3] + topchange;
        if (height < 60) {
          height = 60;
        } else if (
          height >=
          ctx.chartparam.luckysheetCurrentChartResizeWinH -
            ctx.chartparam.luckysheetCurrentChartResizeXy[5] -
            42 -
            6
        ) {
          height =
            ctx.chartparam.luckysheetCurrentChartResizeWinH -
            ctx.chartparam.luckysheetCurrentChartResizeXy[5] -
            42 -
            6;
        }
      }
  
      const resizedata = {
        top,
        left,
        height,
        width,
      };
      ctx.chartparam.luckysheetCurrentChartResizeObj.css(resizedata);
      // resize chart
      ctx.resizeChart(ctx.chartparam.luckysheetCurrentChart);
    }
    // image move
    else if (imageCtrl.move) {
      const mouse = mouseposition(event.pageX, event.pageY);
  
      let x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
      let y = mouse[1] + $("#luckysheet-cell-main").scrollTop();
  
      const imgItem = imageCtrl.images[imageCtrl.currentImgId];
      if (imgItem.isFixedPos) {
        x = event.pageX;
        y = event.pageY;
      }
  
      const myh = $("#luckysheet-modal-dialog-activeImage").height();
      const myw = $("#luckysheet-modal-dialog-activeImage").width();
  
      let top = y - imageCtrl.moveXY[1];
      let left = x - imageCtrl.moveXY[0];
  
      let minTop = 0;
      let maxTop = imageCtrl.currentWinH - myh - 42 - 6;
      let minLeft = 0;
      let maxLeft = imageCtrl.currentWinW - myw - 22 - 36;
  
      if (imgItem.isFixedPos) {
        minTop =
          ctx.infobarHeight +
          ctx.toolbarHeight +
          ctx.calculatebarHeight +
          ctx.columnHeaderHeight;
        maxTop = minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - myh;
        minLeft = ctx.rowHeaderWidth;
        maxLeft = minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - myw;
      }
  
      if (top < minTop) {
        top = minTop;
      }
  
      if (top > maxTop) {
        top = maxTop;
      }
  
      if (left < minLeft) {
        left = minLeft;
      }
  
      if (left > maxLeft) {
        left = maxLeft;
      }
  
      $("#luckysheet-modal-dialog-activeImage").css({ left, top });
    }
    // image resize
    else if (imageCtrl.resize) {
      const mouse = mouseposition(event.pageX, event.pageY);
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      const scrollTop = $("#luckysheet-cell-main").scrollTop();
      const x = mouse[0] + scrollLeft;
      const y = mouse[1] + scrollTop;
  
      if (x < 0 || y < 0) {
        return false;
      }
  
      const { resizeXY } = imageCtrl;
  
      const topchange = y - resizeXY[1];
      const leftchange = x - resizeXY[0];
  
      let top = resizeXY[5];
      let height = resizeXY[3];
      let left = resizeXY[4];
      let width = resizeXY[2];
  
      const { resize } = imageCtrl;
      const imgItem = imageCtrl.images[imageCtrl.currentImgId];
  
      if (imgItem.isFixedPos) {
        const minTop =
          ctx.infobarHeight +
          ctx.toolbarHeight +
          ctx.calculatebarHeight +
          ctx.columnHeaderHeight;
        const minLeft = ctx.rowHeaderWidth;
  
        if (resize == "lt") {
          // 左上
          left = resizeXY[4] - resizeXY[6] + leftchange;
  
          if (left < minLeft) {
            left = minLeft;
          }
  
          if (left > resizeXY[4] - resizeXY[6] + resizeXY[2] - 1) {
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - 1;
          }
  
          width = resizeXY[4] - resizeXY[6] + resizeXY[2] - left;
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
          top = resizeXY[5] - resizeXY[7] + resizeXY[3] - height;
  
          if (top < minTop) {
            top = minTop;
            height = resizeXY[5] - resizeXY[7] + resizeXY[3] - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - width;
          }
  
          if (top > resizeXY[5] - resizeXY[7] + resizeXY[3] - 1) {
            top = resizeXY[5] - resizeXY[7] + resizeXY[3] - 1;
            height = resizeXY[5] - resizeXY[7] + resizeXY[3] - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - width;
          }
        } else if (resize == "lm") {
          // 左中
          left = resizeXY[4] - resizeXY[6] + leftchange;
  
          if (left < minLeft) {
            left = minLeft;
          }
  
          if (left > resizeXY[4] - resizeXY[6] + resizeXY[2] - 1) {
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - 1;
          }
  
          width = resizeXY[4] - resizeXY[6] + resizeXY[2] - left;
  
          top = resizeXY[5] - resizeXY[7];
          height = resizeXY[3];
        } else if (resize == "lb") {
          // 左下
          left = resizeXY[4] - resizeXY[6] + leftchange;
  
          if (left < minLeft) {
            left = minLeft;
          }
  
          if (left > resizeXY[4] - resizeXY[6] + resizeXY[2] - 1) {
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - 1;
          }
  
          width = resizeXY[4] - resizeXY[6] + resizeXY[2] - left;
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
  
          top = resizeXY[5] - resizeXY[7];
  
          if (height < 1) {
            height = 1;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - width;
          }
  
          if (
            height >
            minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top
          ) {
            height = minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[4] - resizeXY[6] + resizeXY[2] - width;
          }
        } else if (resize == "rt") {
          // 右上
          left = resizeXY[4] - resizeXY[6];
  
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          }
  
          if (
            width >
            minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left
          ) {
            width = minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left;
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
          top = resizeXY[5] - resizeXY[7] + resizeXY[3] - height;
  
          if (top < minTop) {
            top = minTop;
            height = resizeXY[5] - resizeXY[7] + resizeXY[3] - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
  
          if (top > resizeXY[5] - resizeXY[7] + resizeXY[3] - 1) {
            top = resizeXY[5] - resizeXY[7] + resizeXY[3] - 1;
            height = resizeXY[5] - resizeXY[7] + resizeXY[3] - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
        } else if (resize == "rm") {
          // 右中
          left = resizeXY[4] - resizeXY[6];
  
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          }
  
          if (
            width >
            minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left
          ) {
            width = minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left;
          }
  
          top = resizeXY[5] - resizeXY[7];
          height = resizeXY[3];
        } else if (resize == "rb") {
          // 右下
          left = resizeXY[4] - resizeXY[6];
  
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          }
  
          if (
            width >
            minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left
          ) {
            width = minLeft + ctx.cellmainWidth - ctx.cellMainSrollBarSize - left;
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
          top = resizeXY[5] - resizeXY[7];
  
          if (height < 1) {
            height = 1;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
  
          if (
            height >
            minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top
          ) {
            height = minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
        } else if (resize == "mt") {
          // 中上
          left = resizeXY[4] - resizeXY[6];
          width = resizeXY[2];
  
          top = resizeXY[5] - resizeXY[7] + topchange;
  
          if (top < minTop) {
            top = minTop;
          }
  
          if (top > resizeXY[5] - resizeXY[7] + resizeXY[3] - 1) {
            top = resizeXY[5] - resizeXY[7] + resizeXY[3] - 1;
          }
  
          height = resizeXY[5] - resizeXY[7] + resizeXY[3] - top;
        } else if (resize == "mb") {
          // 中下
          left = resizeXY[4] - resizeXY[6];
          width = resizeXY[2];
  
          top = resizeXY[5] - resizeXY[7];
  
          height = resizeXY[3] + topchange;
  
          if (height < 1) {
            height = 1;
          }
  
          if (
            height >
            minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top
          ) {
            height = minTop + ctx.cellmainHeight - ctx.cellMainSrollBarSize - top;
          }
        }
      } else {
        if (resize == "lt") {
          // 左上
          left = x;
          width = resizeXY[2] - leftchange;
  
          if (left > resizeXY[2] + resizeXY[4] - 1) {
            left = resizeXY[2] + resizeXY[4] - 1;
            width = resizeXY[2] + resizeXY[0] - (resizeXY[2] + resizeXY[4] - 1);
          } else if (left <= 0) {
            left = 0;
            width = resizeXY[2] + resizeXY[0];
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
          top = resizeXY[3] + resizeXY[1] - height;
  
          if (top > resizeXY[3] + resizeXY[5] - 1) {
            top = resizeXY[3] + resizeXY[5] - 1;
            height = resizeXY[3] + resizeXY[1] - (resizeXY[3] + resizeXY[5] - 1);
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[2] + resizeXY[0] - width;
          } else if (top <= 0) {
            top = 0;
            height = resizeXY[3] + resizeXY[1];
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[2] + resizeXY[0] - width;
          }
        } else if (resize == "lm") {
          // 左中
          left = x;
          width = resizeXY[2] - leftchange;
  
          if (left > resizeXY[2] + resizeXY[4] - 1) {
            left = resizeXY[2] + resizeXY[4] - 1;
            width = resizeXY[2] + resizeXY[0] - (resizeXY[2] + resizeXY[4] - 1);
          } else if (left <= 0) {
            left = 0;
            width = resizeXY[2] + resizeXY[0];
          }
        } else if (resize == "lb") {
          // 左下
          left = x;
          width = resizeXY[2] - leftchange;
  
          if (left > resizeXY[2] + resizeXY[4] - 1) {
            left = resizeXY[2] + resizeXY[4] - 1;
            width = resizeXY[2] + resizeXY[0] - (resizeXY[2] + resizeXY[4] - 1);
          } else if (left <= 0) {
            left = 0;
            width = resizeXY[2] + resizeXY[0];
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
  
          if (height < 1) {
            height = 1;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[2] + resizeXY[0] - width;
          } else if (height >= imageCtrl.currentWinH - resizeXY[5] - 42 - 6) {
            height = imageCtrl.currentWinH - resizeXY[5] - 42 - 6;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
            left = resizeXY[2] + resizeXY[0] - width;
          }
        } else if (resize == "rt") {
          // 右上
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          } else if (width >= imageCtrl.currentWinW - resizeXY[4] - 22 - 36) {
            width = imageCtrl.currentWinW - resizeXY[4] - 22 - 36;
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
          top = resizeXY[3] + resizeXY[1] - height;
  
          if (top > resizeXY[3] + resizeXY[5] - 1) {
            top = resizeXY[3] + resizeXY[5] - 1;
            height = resizeXY[3] + resizeXY[1] - (resizeXY[3] + resizeXY[5] - 1);
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          } else if (top <= 0) {
            top = 0;
            height = resizeXY[3] + resizeXY[1];
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
        } else if (resize == "rm") {
          // 右中
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          } else if (width >= imageCtrl.currentWinW - resizeXY[4] - 22 - 36) {
            width = imageCtrl.currentWinW - resizeXY[4] - 22 - 36;
          }
        } else if (resize == "rb") {
          // 右下
          width = resizeXY[2] + leftchange;
  
          if (width < 1) {
            width = 1;
          } else if (width >= imageCtrl.currentWinW - resizeXY[4] - 22 - 36) {
            width = imageCtrl.currentWinW - resizeXY[4] - 22 - 36;
          }
  
          height = Math.round(width * (resizeXY[3] / resizeXY[2]));
  
          if (height < 1) {
            height = 1;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          } else if (height >= imageCtrl.currentWinH - resizeXY[5] - 42 - 6) {
            height = imageCtrl.currentWinH - resizeXY[5] - 42 - 6;
  
            width = Math.round(height * (resizeXY[2] / resizeXY[3]));
          }
        } else if (resize == "mt") {
          // 中上
          top = y;
          height = resizeXY[3] - topchange;
  
          if (top > resizeXY[3] + resizeXY[5] - 1) {
            top = resizeXY[3] + resizeXY[5] - 1;
            height = resizeXY[3] + resizeXY[1] - (resizeXY[3] + resizeXY[5] - 1);
          } else if (top <= 0) {
            top = 0;
            height = resizeXY[3] + resizeXY[1];
          }
        } else if (resize == "mb") {
          // 中下
          height = resizeXY[3] + topchange;
  
          if (height < 1) {
            height = 1;
          } else if (height >= imageCtrl.currentWinH - resizeXY[5] - 42 - 6) {
            height = imageCtrl.currentWinH - resizeXY[5] - 42 - 6;
          }
        }
      }
  
      $("#luckysheet-modal-dialog-activeImage").css({
        width,
        height,
        left,
        top,
      });
  
      const scaleX = width / imgItem.crop.width;
      const scaleY = height / imgItem.crop.height;
      const defaultWidth = Math.round(imgItem.default.width * scaleX);
      const defaultHeight = Math.round(imgItem.default.height * scaleY);
      const offsetLeft = Math.round(imgItem.crop.offsetLeft * scaleX);
      const offsetTop = Math.round(imgItem.crop.offsetTop * scaleY);
  
      $(
        "#luckysheet-modal-dialog-activeImage .luckysheet-modal-dialog-content"
      ).css({
        "background-size": `${defaultWidth}px ${defaultHeight}px`,
        "background-position": `${-offsetLeft}px ${-offsetTop}px`,
      });
    }
    // image cropChange
    else if (imageCtrl.cropChange) {
      const mouse = mouseposition(event.pageX, event.pageY);
      const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
      const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();
  
      if (x < 0 || y < 0) {
        return false;
      }
  
      const { cropChangeXY } = imageCtrl;
  
      const topchange = y - cropChangeXY[1];
      const leftchange = x - cropChangeXY[0];
  
      const imgItem = imageCtrl.images[imageCtrl.currentImgId];
      const { cropChange } = imageCtrl;
      let width;
      let height;
      let offsetLeft;
      let offsetTop;
  
      if (cropChange == "lt") {
        // 左上
        offsetLeft = imgItem.crop.offsetLeft + leftchange;
  
        if (offsetLeft < 0) {
          offsetLeft = 0;
        }
  
        if (offsetLeft > imgItem.crop.width + imgItem.crop.offsetLeft - 1) {
          offsetLeft = imgItem.crop.width + imgItem.crop.offsetLeft - 1;
        }
  
        width = imgItem.crop.width + imgItem.crop.offsetLeft - offsetLeft;
  
        offsetTop = imgItem.crop.offsetTop + topchange;
  
        if (offsetTop < 0) {
          offsetTop = 0;
        }
  
        if (offsetTop > imgItem.crop.height + imgItem.crop.offsetTop - 1) {
          offsetTop = imgItem.crop.height + imgItem.crop.offsetTop - 1;
        }
  
        height = imgItem.crop.height + imgItem.crop.offsetTop - offsetTop;
      } else if (cropChange == "lm") {
        // 左中
        offsetLeft = imgItem.crop.offsetLeft + leftchange;
  
        if (offsetLeft < 0) {
          offsetLeft = 0;
        }
  
        if (offsetLeft > imgItem.crop.width + imgItem.crop.offsetLeft - 1) {
          offsetLeft = imgItem.crop.width + imgItem.crop.offsetLeft - 1;
        }
  
        width = imgItem.crop.width + imgItem.crop.offsetLeft - offsetLeft;
  
        offsetTop = imgItem.crop.offsetTop;
        height = imgItem.crop.height;
      } else if (cropChange == "lb") {
        // 左下
        offsetLeft = imgItem.crop.offsetLeft + leftchange;
  
        if (offsetLeft < 0) {
          offsetLeft = 0;
        }
  
        if (offsetLeft > imgItem.crop.width + imgItem.crop.offsetLeft - 1) {
          offsetLeft = imgItem.crop.width + imgItem.crop.offsetLeft - 1;
        }
  
        width = imgItem.crop.width + imgItem.crop.offsetLeft - offsetLeft;
  
        offsetTop = imgItem.crop.offsetTop;
  
        height = imgItem.crop.height + topchange;
  
        if (height < 1) {
          height = 1;
        }
  
        if (height > imgItem.default.height - offsetTop) {
          height = imgItem.default.height - offsetTop;
        }
      } else if (cropChange == "rt") {
        // 右上
        offsetLeft = imgItem.crop.offsetLeft;
  
        width = imgItem.crop.width + leftchange;
  
        if (width < 1) {
          width = 1;
        }
  
        if (width > imgItem.default.width - offsetLeft) {
          width = imgItem.default.width - offsetLeft;
        }
  
        offsetTop = imgItem.crop.offsetTop + topchange;
  
        if (offsetTop < 0) {
          offsetTop = 0;
        }
  
        if (offsetTop > imgItem.crop.height + imgItem.crop.offsetTop - 1) {
          offsetTop = imgItem.crop.height + imgItem.crop.offsetTop - 1;
        }
  
        height = imgItem.crop.height + imgItem.crop.offsetTop - offsetTop;
      } else if (cropChange == "rm") {
        // 右中
        offsetLeft = imgItem.crop.offsetLeft;
  
        width = imgItem.crop.width + leftchange;
  
        if (width < 1) {
          width = 1;
        }
  
        if (width > imgItem.default.width - offsetLeft) {
          width = imgItem.default.width - offsetLeft;
        }
  
        offsetTop = imgItem.crop.offsetTop;
        height = imgItem.crop.height;
      } else if (cropChange == "rb") {
        // 右下
        offsetLeft = imgItem.crop.offsetLeft;
  
        width = imgItem.crop.width + leftchange;
  
        if (width < 1) {
          width = 1;
        }
  
        if (width > imgItem.default.width - offsetLeft) {
          width = imgItem.default.width - offsetLeft;
        }
  
        offsetTop = imgItem.crop.offsetTop;
  
        height = imgItem.crop.height + topchange;
  
        if (height < 1) {
          height = 1;
        }
  
        if (height > imgItem.default.height - offsetTop) {
          height = imgItem.default.height - offsetTop;
        }
      } else if (cropChange == "mt") {
        // 中上
        offsetLeft = imgItem.crop.offsetLeft;
        width = imgItem.crop.width;
  
        offsetTop = imgItem.crop.offsetTop + topchange;
  
        if (offsetTop < 0) {
          offsetTop = 0;
        }
  
        if (offsetTop > imgItem.crop.height + imgItem.crop.offsetTop - 1) {
          offsetTop = imgItem.crop.height + imgItem.crop.offsetTop - 1;
        }
  
        height = imgItem.crop.height + imgItem.crop.offsetTop - offsetTop;
      } else if (cropChange == "mb") {
        // 中下
        offsetLeft = imgItem.crop.offsetLeft;
        width = imgItem.crop.width;
  
        offsetTop = imgItem.crop.offsetTop;
  
        height = imgItem.crop.height + topchange;
  
        if (height < 1) {
          height = 1;
        }
  
        if (height > imgItem.default.height - offsetTop) {
          height = imgItem.default.height - offsetTop;
        }
      }
  
      let left = imgItem.default.left + offsetLeft;
      let top = imgItem.default.top + offsetTop;
  
      if (imgItem.isFixedPos) {
        left = imgItem.fixedLeft + offsetLeft;
        top = imgItem.fixedTop + offsetTop;
      }
  
      $("#luckysheet-modal-dialog-cropping").show().css({
        width,
        height,
        left,
        top,
      });
  
      const imageUrlHandle =
        ctx.toJsonOptions && ctx.toJsonOptions.imageUrlHandle;
      const imgSrc =
        typeof imageUrlHandle === "function"
          ? imageUrlHandle(imgItem.src)
          : imgItem.src;
  
      $("#luckysheet-modal-dialog-cropping .cropping-mask").css({
        width: imgItem.default.width,
        height: imgItem.default.height,
        "background-image": `url(${imgSrc})`,
        left: -offsetLeft,
        top: -offsetTop,
      });
  
      $("#luckysheet-modal-dialog-cropping .cropping-content").css({
        "background-image": `url(${imgSrc})`,
        "background-size": `${imgItem.default.width}px ${imgItem.default.height}px`,
        "background-position": `${-offsetLeft}px ${-offsetTop}px`,
      });
  
      imageCtrl.cropChangeObj = {
        width,
        height,
        offsetLeft,
        offsetTop,
      };
    } else if (formula.rangeResize) {
      formula.rangeResizeDraging(
        event,
        formula.rangeResizeObj,
        formula.rangeResizexy,
        formula.rangeResize,
        formula.rangeResizeWinW,
        formula.rangeResizeWinH,
        ctx.ch_width,
        ctx.rh_height
      );
    } else if (formula.rangeMove) {
      formula.rangeMoveDraging(
        event,
        formula.rangeMovexy,
        formula.rangeMoveObj.data("range"),
        formula.rangeMoveObj,
        ctx.sheetBarHeight,
        ctx.statisticBarHeight
      );
    } else if (ctx.chart_selection.rangeResize) {
      ctx.chart_selection.rangeResizeDraging(
        event,
        ctx.sheetBarHeight,
        ctx.statisticBarHeight
      );
    } else if (ctx.chart_selection.rangeMove) {
      ctx.chart_selection.rangeMoveDraging(
        event,
        ctx.sheetBarHeight,
        ctx.statisticBarHeight
      );
    }
    */

  // ctx.jfautoscrollTimeout = window.requestAnimationFrame(mouseRender);
}

export function handleOverlayMouseMove(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  cellInput: HTMLDivElement,
  scrollX: HTMLDivElement,
  scrollY: HTMLDivElement,
  container: HTMLDivElement
) {
  if (onCommentBoxResize(ctx, globalCache, e)) return;
  if (onCommentBoxMove(ctx, globalCache, e)) return;
  if (onImageMove(ctx, globalCache, e)) return;
  if (onImageResize(ctx, globalCache, e)) return;
  overShowComment(ctx, e, scrollX, scrollY, container); // 有批注显示
  // hyperlinkCtrl.overshow(event); // 链接提示显示

  // window.cancelAnimationFrame(ctx.jfautoscrollTimeout);

  /* if (
    luckysheetConfigsetting &&
    luckysheetConfigsetting.hook &&
    luckysheetConfigsetting.hook.sheetMousemove
  ) {
    const mouse = mouseposition(event.pageX, event.pageY);
    const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
    const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();

    const row_location = rowLocation(y);
    let row = row_location[1];
    let row_pre = row_location[0];
    let row_index = row_location[2];
    const col_location = colLocation(x);
    let col = col_location[1];
    let col_pre = col_location[0];
    let col_index = col_location[2];

    const margeset = menuButton.mergeborer(
      ctx.flowdata,
      row_index,
      col_index
    );
    if (margeset) {
      row = margeset.row[1];
      row_pre = margeset.row[0];
      row_index = margeset.row[2];

      col = margeset.column[1];
      col_pre = margeset.column[0];
      col_index = margeset.column[2];
    }

    // if(ctx.flowdata[row_index] && ctx.flowdata[row_index][col_index]){
    const sheetFile = sheetmanage.getSheetByIndex();

    const moveState = {
      functionResizeStatus: formula.functionResizeStatus,
      horizontalmoveState: !!luckysheetFreezen.horizontalmovestate,
      verticalmoveState: !!luckysheetFreezen.verticalmovestate,
      pivotTableMoveState: !!pivotTable && pivotTable.movestate,
      sheetMoveStatus: ctx.luckysheet_sheet_move_status,
      scrollStatus: !!ctx.luckysheet_scroll_status,
      selectStatus: !!ctx.luckysheet_select_status,
      rowsSelectedStatus: !!ctx.luckysheet_rows_selected_status,
      colsSelectedStatus: !!ctx.luckysheet_cols_selected_status,
      cellSelectedMove: !!ctx.luckysheet_cell_selected_move,
      cellSelectedExtend: !!ctx.luckysheet_cell_selected_extend,
      colsChangeSize: !!ctx.luckysheet_cols_change_size,
      rowsChangeSize: !!ctx.luckysheet_rows_change_size,
      chartMove: !!ctx.chartparam.luckysheetCurrentChartMove,
      chartResize: !!ctx.chartparam.luckysheetCurrentChartResize,
      rangeResize: !!formula.rangeResize,
      rangeMove: !!formula.rangeMove,
    };

    const luckysheetTableContent = $("#luckysheetTableContent")
      .get(0)
      .getContext("2d");

    if (ctx.flowdata && ctx.flowdata[row_index]) {
      method.createHookFunction(
        "sheetMousemove",
        ctx.flowdata[row_index][col_index],
        {
          r: row_index,
          c: col_index,
          start_r: row_pre,
          start_c: col_pre,
          end_r: row,
          end_c: col,
        },
        sheetFile,
        moveState,
        luckysheetTableContent
      );
    }
    // }
  }

  if (formula.functionResizeStatus) {
    const y = event.pageY;
    const movepx = y - formula.functionResizeData.y;
    let mpx = formula.functionResizeData.calculatebarHeight + movepx;
    const winh = Math.round($(window).height() / 2);

    if (mpx <= 28) {
      if (mpx <= 20) {
        return;
      }
      mpx = 28;
    } else if (mpx >= winh) {
      if (mpx >= winh + 8) {
        return;
      }
      mpx = winh;
    }

    ctx.calculatebarHeight = mpx;
    $("#luckysheet-wa-calculate").css("height", ctx.calculatebarHeight - 2);
    $("#luckysheet-wa-calculate-size").css({
      background: "#5e5e5e",
      cursor: "ns-resize",
    });

    clearTimeout(formula.functionResizeTimeout);
    formula.functionResizeTimeout = setTimeout(function () {
      luckysheetsizeauto();
    }, 15);
  } else if (!!pivotTable && pivotTable.movestate) {
    const x = event.pageX;
    const y = event.pageY;
    $("#luckysheet-modal-dialog-slider-pivot-move").css({
      left: x - pivotTable.movesave.width / 2,
      top: y - pivotTable.movesave.height,
    });
  } else if (ctx.luckysheet_sheet_move_status) {
    const scrollLeft = $("#fortune-sheettab-container-c").scrollLeft();
    const x = event.pageX + scrollLeft;

    if (Math.abs(event.pageX - ctx.luckysheet_sheet_move_data.pageX) < 3) {
      return;
    }

    const winW = $("#fortune-sheettab-container").width();
    const left =
      x -
      ctx.luckysheet_sheet_move_data.curleft -
      $("#fortune-sheettab-container").offset().left;
    ctx.luckysheet_sheet_move_data.activeobject.css({ left });

    let row_index = luckysheet_searcharray(
      ctx.luckysheet_sheet_move_data.widthlist,
      left + ctx.luckysheet_sheet_move_data.curleft
    );
    ctx.luckysheet_sheet_move_data.cursorobject.css({ cursor: "move" });

    if (left - scrollLeft <= 6) {
      $("#luckysheet-sheets-leftscroll").click();
    }

    if (left - scrollLeft >= winW - 40) {
      $("#luckysheet-sheets-rightscroll").click();
    }

    if (row_index != ctx.luckysheet_sheet_move_data.curindex) {
      if (row_index == -1 && left > 0) {
        row_index = ctx.luckysheet_sheet_move_data.widthlist.length - 1;
        $("#luckysheet-sheets-item-clone").insertAfter(
          $("#luckysheet-sheet-area div.luckysheet-sheets-item:visible").eq(
            row_index
          )
        );
      } else if (row_index == -1 && left <= 0) {
        $("#luckysheet-sheets-item-clone").insertBefore(
          $("#luckysheet-sheet-area div.luckysheet-sheets-item:visible").eq(0)
        );
      } else {
        $("#luckysheet-sheets-item-clone").insertAfter(
          $("#luckysheet-sheet-area div.luckysheet-sheets-item:visible").eq(
            row_index
          )
        );
      }

      ctx.luckysheet_sheet_move_data.widthlist = [];
      $("#luckysheet-sheet-area div.luckysheet-sheets-item:visible").each(
        function (i) {
          if (i == 0) {
            ctx.luckysheet_sheet_move_data.widthlist.push(
              parseInt($(this).outerWidth())
            );
          } else {
            ctx.luckysheet_sheet_move_data.widthlist.push(
              parseInt($(this).outerWidth()) +
                ctx.luckysheet_sheet_move_data.widthlist[i - 1]
            );
          }
        }
      );

      ctx.luckysheet_sheet_move_data.curindex = $(
        "#luckysheet-sheet-area div.luckysheet-sheets-item:visible"
      ).index($("#luckysheet-sheets-item-clone"));
    }
  } else if (ctx.luckysheet_model_move_state) {
    const scrollTop = $(document).scrollTop();
    const scrollLeft = $(document).scrollLeft();
    const y = event.pageY + scrollTop;
    const x = event.pageX + scrollLeft;
    const winH = $(window).height();
    const winW = $(window).width();
    const myh = ctx.luckysheet_model_move_obj.height();
    const myw = ctx.luckysheet_model_move_obj.width();
    let top = y - ctx.luckysheet_model_xy[1];
    let left = x - ctx.luckysheet_model_xy[0];

    if (top < 0) {
      top = 0;
    }

    if (top + myh + 62 > winH) {
      top = winH - myh - 62;
    }

    if (left < 0) {
      left = 0;
    }

    if (left + myw + 86 > winW) {
      left = winW - myw - 86;
    }

    ctx.luckysheet_model_move_obj.css({ top, left });
    event.preventDefault();
  } else */ if (
    !!ctx.luckysheet_scroll_status ||
    !!ctx.luckysheet_select_status ||
    !!ctx.luckysheet_rows_selected_status ||
    !!ctx.luckysheet_cols_selected_status ||
    !!ctx.luckysheet_cell_selected_move ||
    !!ctx.luckysheet_cell_selected_extend ||
    !!ctx.luckysheet_cols_change_size ||
    !!ctx.luckysheet_rows_change_size
    // !!ctx.chartparam?.luckysheetCurrentChartMove ||
    // !!ctx.chartparam?.luckysheetCurrentChartResize ||
    // !!formula?.rangeResize ||
    // !!formula?.rangeMove
  ) {
    // if (ctx.luckysheet_select_status) {
    //   clearTimeout(ctx.countfuncTimeout);
    //   ctx.countfuncTimeout = setTimeout(function () {
    //     countfunc();
    //   }, 500);
    // }

    mouseRender(ctx, globalCache, e, cellInput, scrollX, scrollY, container);
    // ctx.jfautoscrollTimeout = window.requestAnimationFrame(mouseRender);
  }
}

export function handleOverlayMouseUp(
  ctx: Context,
  globalCache: GlobalCache,
  settings: Settings,
  e: MouseEvent,
  container: HTMLDivElement
) {
  const rect = container.getBoundingClientRect();
  // 批注框 移动结束
  onImageMoveEnd(ctx, globalCache, container);
  onImageResizeEnd(ctx, globalCache, container);
  onCommentBoxMoveEnd(ctx, globalCache, container);
  onCommentBoxResizeEnd(ctx, globalCache, container);
  onFormulaRangeDragEnd(ctx);
  // if (
  //   luckysheetConfigsetting &&
  //   luckysheetConfigsetting.hook &&
  //   luckysheetConfigsetting.hook.sheetMouseup
  // ) {
  //   const mouse = mouseposition(event.pageX, event.pageY);
  //   const x = mouse[0] + $("#luckysheet-cell-main").scrollLeft();
  //   const y = mouse[1] + $("#luckysheet-cell-main").scrollTop();

  //   const row_location = rowLocation(y);
  //   let row = row_location[1];
  //   let row_pre = row_location[0];
  //   let row_index = row_location[2];
  //   const col_location = colLocation(x);
  //   let col = col_location[1];
  //   let col_pre = col_location[0];
  //   let col_index = col_location[2];

  //   const margeset = menuButton.mergeborer(
  //     ctx.flowdata,
  //     row_index,
  //     col_index
  //   );
  //   if (margeset) {
  //     row = margeset.row[1];
  //     row_pre = margeset.row[0];
  //     row_index = margeset.row[2];

  //     col = margeset.column[1];
  //     col_pre = margeset.column[0];
  //     col_index = margeset.column[2];
  //   }

  //   // if(ctx.flowdata[row_index] && ctx.flowdata[row_index][col_index]){
  //   const sheetFile = sheetmanage.getSheetByIndex();

  //   const moveState = {
  //     functionResizeStatus: formula.functionResizeStatus,
  //     horizontalmoveState: !!luckysheetFreezen.horizontalmovestate,
  //     verticalmoveState: !!luckysheetFreezen.verticalmovestate,
  //     pivotTableMoveState: !!pivotTable && pivotTable.movestate,
  //     sheetMoveStatus: ctx.luckysheet_sheet_move_status,
  //     scrollStatus: !!ctx.luckysheet_scroll_status,
  //     selectStatus: !!ctx.luckysheet_select_status,
  //     rowsSelectedStatus: !!ctx.luckysheet_rows_selected_status,
  //     colsSelectedStatus: !!ctx.luckysheet_cols_selected_status,
  //     cellSelectedMove: !!ctx.luckysheet_cell_selected_move,
  //     cellSelectedExtend: !!ctx.luckysheet_cell_selected_extend,
  //     colsChangeSize: !!ctx.luckysheet_cols_change_size,
  //     rowsChangeSize: !!ctx.luckysheet_rows_change_size,
  //     chartMove: !!ctx.chartparam.luckysheetCurrentChartMove,
  //     chartResize: !!ctx.chartparam.luckysheetCurrentChartResize,
  //     rangeResize: !!formula.rangeResize,
  //     rangeMove: !!formula.rangeMove,
  //   };

  //   const luckysheetTableContent = $("#luckysheetTableContent")
  //     .get(0)
  //     .getContext("2d");

  //   method.createHookFunction(
  //     "sheetMouseup",
  //     ctx.flowdata[row_index][col_index],
  //     {
  //       r: row_index,
  //       c: col_index,
  //       start_r: row_pre,
  //       start_c: col_pre,
  //       end_r: row,
  //       end_c: col,
  //     },
  //     sheetFile,
  //     moveState,
  //     luckysheetTableContent
  //   );
  //   // }
  // }

  // 数据窗格主体
  if (ctx.luckysheet_select_status) {
    // clearTimeout(ctx.countfuncTimeout);
    // ctx.countfuncTimeout = setTimeout(function () {
    //   countfunc();
    // }, 0);
    // 格式刷
    if (ctx.luckysheetPaintModelOn) {
      pasteHandlerOfPaintModel(ctx, ctx.luckysheet_copy_save);
      if (ctx.luckysheetPaintSingle) {
        // 单次 格式刷
        cancelPaintModel(ctx);
      }
    }
  }

  ctx.luckysheet_select_status = false;
  window.cancelAnimationFrame(ctx.jfautoscrollTimeout);
  ctx.luckysheet_scroll_status = false;

  // $("#luckysheet-cell-selected")
  //   .find(".luckysheet-cs-fillhandle")
  //   .css("cursor", "crosshair")
  //   .end()
  //   .find(".luckysheet-cs-draghandle")
  //   .css("cursor", "move");
  // $(
  //   "#luckysheet-cell-main, #luckysheetTableContent, #luckysheet-sheettable_0"
  // ).css("cursor", "default");

  // 行标题窗格主体
  ctx.luckysheet_rows_selected_status = false;

  // 列标题窗格主体
  ctx.luckysheet_cols_selected_status = false;

  ctx.luckysheet_model_move_state = false;

  /*
    if (formula.functionResizeStatus) {
      formula.functionResizeStatus = false;
      $("#luckysheet-wa-calculate-size").removeAttr("style");
    }
  
    if (luckysheetFreezen.horizontalmovestate) {
      luckysheetFreezen.horizontalmovestate = false;
      $("#luckysheet-freezebar-horizontal").removeClass(
        "luckysheet-freezebar-active"
      );
      $("#luckysheet-freezebar-horizontal")
        .find(".luckysheet-freezebar-horizontal-handle")
        .css("cursor", "-webkit-grab");
      if (
        luckysheetFreezen.freezenhorizontaldata[4] <= ctx.columnHeaderHeight
      ) {
        luckysheetFreezen.cancelFreezenHorizontal();
      }
      luckysheetFreezen.createAssistCanvas();
      luckysheetrefreshgrid();
    }
  
    if (luckysheetFreezen.verticalmovestate) {
      luckysheetFreezen.verticalmovestate = false;
      $("#luckysheet-freezebar-vertical").removeClass(
        "luckysheet-freezebar-active"
      );
      $("#luckysheet-freezebar-vertical")
        .find(".luckysheet-freezebar-vertical-handle")
        .css("cursor", "-webkit-grab");
      if (luckysheetFreezen.freezenverticaldata[4] <= ctx.rowHeaderWidth) {
        luckysheetFreezen.cancelFreezenVertical();
      }
      luckysheetFreezen.createAssistCanvas();
      luckysheetrefreshgrid();
    }
  
    if (!!pivotTable && pivotTable.movestate) {
      $("#luckysheet-modal-dialog-slider-pivot-move").remove();
      pivotTable.movestate = false;
      $(
        "#luckysheet-modal-dialog-pivotTable-list, #luckysheet-modal-dialog-config-filter, #luckysheet-modal-dialog-config-row, #luckysheet-modal-dialog-config-column, #luckysheet-modal-dialog-config-value"
      ).css("cursor", "default");
      if (
        pivotTable.movesave.containerid !=
        "luckysheet-modal-dialog-pivotTable-list"
      ) {
        const $cur = $(event.target).closest(
          ".luckysheet-modal-dialog-slider-config-list"
        );
        if ($cur.length == 0) {
          if (
            pivotTable.movesave.containerid ==
            "luckysheet-modal-dialog-config-value"
          ) {
            pivotTable.resetOrderby(pivotTable.movesave.obj);
          }
  
          pivotTable.movesave.obj.remove();
          pivotTable.showvaluecolrow();
          $("#luckysheet-modal-dialog-pivotTable-list")
            .find(".luckysheet-modal-dialog-slider-list-item")
            .each(function () {
              $(this)
                .find(".luckysheet-slider-list-item-selected")
                .find("i")
                .remove();
            });
  
          $(
            "#luckysheet-modal-dialog-config-filter, #luckysheet-modal-dialog-config-row, #luckysheet-modal-dialog-config-column, #luckysheet-modal-dialog-config-value"
          )
            .find(".luckysheet-modal-dialog-slider-config-item")
            .each(function () {
              const index = $(this).data("index");
  
              $("#luckysheet-modal-dialog-pivotTable-list")
                .find(".luckysheet-modal-dialog-slider-list-item")
                .each(function () {
                  const $seleted = $(this).find(
                    ".luckysheet-slider-list-item-selected"
                  );
                  if (
                    $(this).data("index") == index &&
                    $seleted.find("i").length == 0
                  ) {
                    $seleted.append(
                      '<i class="fa fa-check luckysheet-mousedown-cancel"></i>'
                    );
                  }
                });
            });
  
          pivotTable.refreshPivotTable();
        }
      }
    }
  
    if (ctx.luckysheet_sheet_move_status) {
      ctx.luckysheet_sheet_move_status = false;
      ctx.luckysheet_sheet_move_data.activeobject.insertBefore(
        $("#luckysheet-sheets-item-clone")
      );
      ctx.luckysheet_sheet_move_data.activeobject.removeAttr("style");
      $("#luckysheet-sheets-item-clone").remove();
      ctx.luckysheet_sheet_move_data.cursorobject.css({ cursor: "pointer" });
      ctx.luckysheet_sheet_move_data = {};
      sheetmanage.reOrderAllSheet();
    }
  
    // chart move debounce timer clear
    clearTimeout(ctx.chartparam.luckysheetCurrentChartMoveTimeout);
  
    // 图表拖动 chartMix
    if (ctx.chartparam.luckysheetCurrentChartMove) {
      ctx.chartparam.luckysheetCurrentChartMove = false;
      if (ctx.chartparam.luckysheetInsertChartTosheetChange) {
        // myTop, myLeft: 本次的chart框位置，scrollLeft,scrollTop: 上一次的滚动条位置
        var myTop = ctx.chartparam.luckysheetCurrentChartMoveObj.css("top");
        var myLeft = ctx.chartparam.luckysheetCurrentChartMoveObj.css("left");
        var scrollLeft = $("#luckysheet-cell-main").scrollLeft();
        var scrollTop = $("#luckysheet-cell-main").scrollTop();
  
        // 点击时候存储的信息，即上一次操作结束的图表信息，x,y: chart框位置，scrollLeft1,scrollTop1: 滚动条位置
        var x = ctx.chartparam.luckysheetCurrentChartMoveXy[2];
        var y = ctx.chartparam.luckysheetCurrentChartMoveXy[3];
  
        var scrollLeft1 = ctx.chartparam.luckysheetCurrentChartMoveXy[4];
        var scrollTop1 = ctx.chartparam.luckysheetCurrentChartMoveXy[5];
  
        var chart_id = ctx.chartparam.luckysheetCurrentChartMoveObj
          .find(".luckysheet-modal-dialog-content")
          .attr("id");
  
        // 去除chartobj,改用chart_id代替即可定位到此图表
        ctx.jfredo.push({
          type: "moveChart",
          chart_id,
          sheetIndex: ctx.currentSheetIndex,
          myTop,
          myLeft,
          scrollTop,
          scrollLeft,
          x,
          y,
          scrollTop1,
          scrollLeft1,
        });
  
        // luckysheet.sheetmanage.saveChart({ "chart_id": chart_id, "sheetIndex": sheetIndex, "top": myTop, "left": myLeft });
        // 存储滚动条位置//协同编辑时可能影响用户操作，可以考虑不存储滚动条位置,或者滚动条信息仅仅保存到后台，但是不分发到其他设备（google sheet没有存储滚动条位置）
        // ctx.server.saveParam("c", sheetIndex, { "left":myLeft, "top":myTop,"scrollTop": scrollTop, "scrollLeft": scrollLeft }, { "op":"xy", "cid": chart_id});
      }
    }
  
    // 图表改变大小 chartMix
    if (ctx.chartparam.luckysheetCurrentChartResize) {
      ctx.chartparam.luckysheetCurrentChartResize = null;
      if (ctx.chartparam.luckysheetInsertChartTosheetChange) {
        const myHeight =
          ctx.chartparam.luckysheetCurrentChartResizeObj.height();
        const myWidth = ctx.chartparam.luckysheetCurrentChartResizeObj.width();
        var scrollLeft = $("#luckysheet-cell-main").scrollLeft();
        var scrollTop = $("#luckysheet-cell-main").scrollTop();
  
        var myTop = ctx.chartparam.luckysheetCurrentChartMoveObj.css("top");
        var myLeft = ctx.chartparam.luckysheetCurrentChartMoveObj.css("left");
  
        var chart_id = ctx.chartparam.luckysheetCurrentChartResizeObj
          .find(".luckysheet-modal-dialog-content")
          .attr("id");
  
        const myWidth1 = ctx.chartparam.luckysheetCurrentChartResizeXy[2];
        const myHeight1 = ctx.chartparam.luckysheetCurrentChartResizeXy[3];
        var x = ctx.chartparam.luckysheetCurrentChartResizeXy[4]; // 增加上一次的位置x，y
        var y = ctx.chartparam.luckysheetCurrentChartResizeXy[5];
        var scrollLeft1 = ctx.chartparam.luckysheetCurrentChartResizeXy[6];
        var scrollTop1 = ctx.chartparam.luckysheetCurrentChartResizeXy[7];
  
        ctx.jfredo.push({
          type: "resizeChart",
          chart_id,
          sheetIndex: ctx.currentSheetIndex,
          myTop,
          myLeft,
          myHeight,
          myWidth,
          scrollTop,
          scrollLeft,
          x,
          y,
          myWidth1,
          myHeight1,
          scrollTop1,
          scrollLeft1,
        });
  
        // 加上滚动条的位置
        // luckysheet.sheetmanage.saveChart({ "chart_id": chart_id, "sheetIndex": sheetIndex, "height": myHeight, "width": myWidth, "top": myTop, "left": myLeft, "scrollTop": scrollTop, "scrollLeft": scrollLeft });
  
        // ctx.server.saveParam("c", sheetIndex, { "width":myWidth, "height":myHeight, "top": myTop, "left": myLeft, "scrollTop": scrollTop, "scrollLeft": scrollLeft}, { "op":"wh", "cid": chart_id});
      }
    }
  
    if (formula.rangeResize) {
      formula.rangeResizeDragged(
        event,
        formula.rangeResizeObj,
        formula.rangeResize,
        formula.rangeResizexy,
        formula.rangeResizeWinW,
        formula.rangeResizeWinH
      );
    }
  
    // image move
    if (imageCtrl.move) {
      imageCtrl.moveImgItem();
    }
  
    // image resize
    if (imageCtrl.resize) {
      imageCtrl.resizeImgItem();
    }
  
    // image cropChange
    if (imageCtrl.cropChange) {
      imageCtrl.cropChangeImgItem();
    }
    */

  // 改变行高
  if (ctx.luckysheet_rows_change_size) {
    ctx.luckysheet_rows_change_size = false;

    // $("#luckysheet-change-size-line").hide();
    // $("#luckysheet-rows-change-size").css("opacity", 0);
    // $(
    //   "#luckysheet-sheettable, #luckysheet-rows-h, #luckysheet-rows-h canvas"
    // ).css("cursor", "default");

    const { scrollTop } = ctx;
    const y = e.pageY - rect.top - ctx.columnHeaderHeight + scrollTop;
    const winH = rect.height;

    let size = y + 3 - ctx.luckysheet_rows_change_size_start[0];

    if (y + 3 - ctx.luckysheet_rows_change_size_start[0] < 19) {
      size = 19;
    }

    if (y >= winH - 200 + scrollTop) {
      size = winH - 200 - ctx.luckysheet_rows_change_size_start[0] + scrollTop;
    }

    const cfg = ctx.config;
    if (cfg.rowlen == null) {
      cfg.rowlen = {};
    }

    if (cfg.customHeight == null) {
      cfg.customHeight = {};
    }

    cfg.customHeight[ctx.luckysheet_rows_change_size_start[1]] = 1;

    const changeRowIndex = ctx.luckysheet_rows_change_size_start[1];
    let changeRowSelected = false;
    if ((ctx.luckysheet_select_save?.length ?? 0) > 0) {
      ctx.luckysheet_select_save
        ?.filter((select) => select.row_select)
        ?.some((select) => {
          if (
            changeRowIndex >= select.row[0] &&
            changeRowIndex <= select.row[1]
          ) {
            changeRowSelected = true;
          }
          return changeRowSelected;
        });
    }
    if (changeRowSelected) {
      cfg.rowlen ||= {};
      ctx.luckysheet_select_save
        ?.filter((select) => select.row_select)
        ?.forEach((select) => {
          for (let r = select.row[0]; r <= select.row[1]; r += 1) {
            cfg.rowlen![r] = Math.ceil(size / ctx.zoomRatio);
          }
        });
    } else {
      cfg.rowlen[ctx.luckysheet_rows_change_size_start[1]] = Math.ceil(
        size / ctx.zoomRatio
      );
    }

    // const images = imageCtrl.moveChangeSize(
    //   "row",
    //   ctx.luckysheet_rows_change_size_start[1],
    //   size
    // );

    // if (ctx.clearjfundo) {
    //   ctx.jfundo.length = 0;

    //   ctx.jfredo.push({
    //     type: "resize",
    //     ctrlType: "resizeR",
    //     sheetIndex: ctx.currentSheetIndex,
    //     config: $.extend(true, {}, ctx.config),
    //     curconfig: $.extend(true, {}, cfg),
    //     images: $.extend(true, {}, imageCtrl.images),
    //     curImages: $.extend(true, {}, images),
    //   });
    // }

    // config
    ctx.config = cfg;
    const idx = getSheetIndex(ctx, ctx.currentSheetIndex);
    if (idx == null) return;
    ctx.luckysheetfile[idx].config = ctx.config;

    // server.saveParam("cg", ctx.currentSheetIndex, cfg.rowlen, {
    //   k: "rowlen",
    // });

    // images
    // ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].images = images;
    // server.saveParam("all", ctx.currentSheetIndex, images, { k: "images" });
    // imageCtrl.images = images;
    // imageCtrl.allImagesShow();

    // jfrefreshgrid_rhcw(ctx.flowdata.length, null);
  }

  // 改变列宽
  if (ctx.luckysheet_cols_change_size) {
    ctx.luckysheet_cols_change_size = false;

    const { scrollLeft } = ctx;
    const x = e.pageX - rect.left - ctx.rowHeaderWidth + scrollLeft;
    const winW = rect.width;

    let size = x + 3 - ctx.luckysheet_cols_change_size_start[0];

    let firstcolumnlen = ctx.defaultcollen;
    if (
      ctx.config.columnlen != null &&
      ctx.config.columnlen[ctx.luckysheet_cols_change_size_start[1]] != null
    ) {
      firstcolumnlen =
        ctx.config.columnlen[ctx.luckysheet_cols_change_size_start[1]];
    }

    if (Math.abs(size - firstcolumnlen) < 3) {
      return;
    }
    if (x + 3 - ctx.luckysheet_cols_change_size_start[0] < 30) {
      size = 30;
    }

    if (x >= winW - 100 + scrollLeft) {
      size = winW - 100 - ctx.luckysheet_cols_change_size_start[0] + scrollLeft;
    }

    const cfg = ctx.config;
    if (cfg.columnlen == null) {
      cfg.columnlen = {};
    }

    if (cfg.customWidth == null) {
      cfg.customWidth = {};
    }

    cfg.customWidth[ctx.luckysheet_cols_change_size_start[1]] = 1;

    const changeColumnIndex = ctx.luckysheet_cols_change_size_start[1];
    let changeColumnSelected = false;
    if ((ctx.luckysheet_select_save?.length ?? 0) > 0) {
      ctx.luckysheet_select_save
        ?.filter((select) => select.column_select)
        ?.some((select) => {
          if (
            changeColumnIndex >= select.column[0] &&
            changeColumnIndex <= select.column[1]
          ) {
            changeColumnSelected = true;
          }
          return changeColumnSelected;
        });
    }
    if (changeColumnSelected) {
      cfg.columnlen ||= {};
      ctx.luckysheet_select_save
        ?.filter((select) => select.column_select)
        ?.forEach((select) => {
          for (let r = select.column[0]; r <= select.column[1]; r += 1) {
            cfg.columnlen![r] = Math.ceil(size / ctx.zoomRatio);
          }
        });
    } else {
      cfg.columnlen[ctx.luckysheet_cols_change_size_start[1]] = Math.ceil(
        size / ctx.zoomRatio
      );
    }

    // const images = imageCtrl.moveChangeSize(
    //   "column",
    //   ctx.luckysheet_cols_change_size_start[1],
    //   size
    // );

    // if (ctx.clearjfundo) {
    //   ctx.jfundo.length = 0;

    //   ctx.jfredo.push({
    //     type: "resize",
    //     ctrlType: "resizeC",
    //     sheetIndex: ctx.currentSheetIndex,
    //     config: $.extend(true, {}, ctx.config),
    //     curconfig: $.extend(true, {}, cfg),
    //     images: $.extend(true, {}, imageCtrl.images),
    //     curImages: $.extend(true, {}, images),
    //   });
    // }

    // config
    ctx.config = cfg;
    const idx = getSheetIndex(ctx, ctx.currentSheetIndex);
    if (idx == null) return;
    ctx.luckysheetfile[idx].config = ctx.config;

    // server.saveParam("cg", ctx.currentSheetIndex, cfg.columnlen, {
    //   k: "columnlen",
    // });

    // images
    // ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)].images =
    //   images;
    // server.saveParam("all", ctx.currentSheetIndex, images, { k: "images" });
    // imageCtrl.images = images;
    // imageCtrl.allImagesShow();

    // jfrefreshgrid_rhcw(null, ctx.flowdata[0].length);

    // setTimeout(function () {
    //   luckysheetrefreshgrid();
    // }, 1);
  }

  // if (formula.rangeMove) {
  //   formula.rangeMoveDragged(formula.rangeMoveObj);
  // }

  // 改变选择框的位置并替换目标单元格
  if (ctx.luckysheet_cell_selected_move) {
    /*
      $("#luckysheet-cell-selected-move").hide();
  
      ctx.luckysheet_cell_selected_move = false;
      const mouse = mouseposition(event.pageX, event.pageY);
  
      if (
        !checkProtectionLockedRangeList(
          ctx.luckysheet_select_save,
          ctx.currentSheetIndex
        )
      ) {
        return;
      }
  
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      const scrollTop = $("#luckysheet-cell-main").scrollTop();
  
      const x = mouse[0] + scrollLeft;
      const y = mouse[1] + scrollTop;
  
      const winH =
        $(window).height() +
        scrollTop -
        ctx.sheetBarHeight -
        ctx.statisticBarHeight;
      const winW = $(window).width() + scrollLeft;
  
      const row_index = rowLocation(y)[2];
      const col_index = colLocation(x)[2];
  
      const row_index_original = ctx.luckysheet_cell_selected_move_index[0];
      const col_index_original = ctx.luckysheet_cell_selected_move_index[1];
  
      if (row_index == row_index_original && col_index == col_index_original) {
        return;
      }
  
      const d = editor.deepCopyFlowData(ctx.flowdata);
      const last =
        ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
  
      const data = getdatabyselection(last);
  
      let cfg = $.extend(true, {}, ctx.config);
      if (cfg.merge == null) {
        cfg.merge = {};
      }
      if (cfg.rowlen == null) {
        cfg.rowlen = {};
      }
  
      // 选区包含部分单元格
      if (
        hasPartMC(cfg, last.row[0], last.row[1], last.column[0], last.column[1])
      ) {
        if (isEditMode()) {
          alert(locale_drag.noMerge);
        } else {
          tooltip.info(
            '<i class="fa fa-exclamation-triangle"></i>',
            locale_drag.noMerge
          );
        }
        return;
      }
  
      let row_s = last.row[0] - row_index_original + row_index;
      let row_e = last.row[1] - row_index_original + row_index;
      let col_s = last.column[0] - col_index_original + col_index;
      let col_e = last.column[1] - col_index_original + col_index;
  
      if (
        !checkProtectionLockedRangeList(
          [{ row: [row_s, row_e], column: [col_s, col_e] }],
          ctx.currentSheetIndex
        )
      ) {
        return;
      }
  
      if (row_s < 0 || y < 0) {
        row_s = 0;
        row_e = last.row[1] - last.row[0];
      }
  
      if (col_s < 0 || x < 0) {
        col_s = 0;
        col_e = last.column[1] - last.column[0];
      }
  
      if (
        row_e >= ctx.visibledatarow[ctx.visibledatarow.length - 1] ||
        y > winH
      ) {
        row_s = ctx.visibledatarow.length - 1 - last.row[1] + last.row[0];
        row_e = ctx.visibledatarow.length - 1;
      }
  
      if (
        col_e >= ctx.visibledatacolumn[ctx.visibledatacolumn.length - 1] ||
        x > winW
      ) {
        col_s =
          ctx.visibledatacolumn.length - 1 - last.column[1] + last.column[0];
        col_e = ctx.visibledatacolumn.length - 1;
      }
  
      // 替换的位置包含部分单元格
      if (hasPartMC(cfg, row_s, row_e, col_s, col_e)) {
        if (isEditMode()) {
          alert(locale_drag.noMerge);
        } else {
          tooltip.info(
            '<i class="fa fa-exclamation-triangle"></i>',
            locale_drag.noMerge
          );
        }
        return;
      }
  
      const borderInfoCompute = getBorderInfoCompute(ctx.currentSheetIndex);
  
      // 删除原本位置的数据
      let RowlChange = null;
      for (let r = last.row[0]; r <= last.row[1]; r++) {
        if (r in cfg.rowlen) {
          RowlChange = true;
        }
  
        for (let c = last.column[0]; c <= last.column[1]; c++) {
          const cell = d[r][c];
  
          if (getObjType(cell) == "object" && "mc" in cell) {
            if (`${cell.mc.r}_${cell.mc.c}` in cfg.merge) {
              delete cfg.merge[`${cell.mc.r}_${cell.mc.c}`];
            }
          }
  
          d[r][c] = null;
        }
      }
  
      // 边框
      if (cfg.borderInfo && cfg.borderInfo.length > 0) {
        const borderInfo = [];
  
        for (let i = 0; i < cfg.borderInfo.length; i++) {
          const bd_rangeType = cfg.borderInfo[i].rangeType;
  
          if (bd_rangeType == "range") {
            const bd_range = cfg.borderInfo[i].range;
            let bd_emptyRange = [];
  
            for (let j = 0; j < bd_range.length; j++) {
              bd_emptyRange = bd_emptyRange.concat(
                conditionformat.CFSplitRange(
                  bd_range[j],
                  { row: last.row, column: last.column },
                  { row: [row_s, row_e], column: [col_s, col_e] },
                  "restPart"
                )
              );
            }
  
            cfg.borderInfo[i].range = bd_emptyRange;
  
            borderInfo.push(cfg.borderInfo[i]);
          } else if (bd_rangeType == "cell") {
            const bd_r = cfg.borderInfo[i].value.row_index;
            const bd_c = cfg.borderInfo[i].value.col_index;
  
            if (
              !(
                bd_r >= last.row[0] &&
                bd_r <= last.row[1] &&
                bd_c >= last.column[0] &&
                bd_c <= last.column[1]
              )
            ) {
              borderInfo.push(cfg.borderInfo[i]);
            }
          }
        }
  
        cfg.borderInfo = borderInfo;
      }
      // 替换位置数据更新
      const offsetMC = {};
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[0].length; c++) {
          if (borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]) {
            const bd_obj = {
              rangeType: "cell",
              value: {
                row_index: r + row_s,
                col_index: c + col_s,
                l: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]
                  .l,
                r: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]
                  .r,
                t: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]
                  .t,
                b: borderInfoCompute[`${r + last.row[0]}_${c + last.column[0]}`]
                  .b,
              },
            };
  
            if (cfg.borderInfo == null) {
              cfg.borderInfo = [];
            }
  
            cfg.borderInfo.push(bd_obj);
          }
  
          let value = "";
          if (data[r] != null && data[r][c] != null) {
            value = data[r][c];
          }
  
          if (getObjType(value) == "object" && "mc" in value) {
            const mc = $.extend(true, {}, value.mc);
            if ("rs" in value.mc) {
              offsetMC[`${mc.r}_${mc.c}`] = [r + row_s, c + col_s];
  
              value.mc.r = r + row_s;
              value.mc.c = c + col_s;
  
              cfg.merge[`${r + row_s}_${c + col_s}`] = value.mc;
            } else {
              value.mc.r = offsetMC[`${mc.r}_${mc.c}`][0];
              value.mc.c = offsetMC[`${mc.r}_${mc.c}`][1];
            }
          }
          d[r + row_s][c + col_s] = value;
        }
      }
  
      if (RowlChange) {
        cfg = rowlenByRange(d, last.row[0], last.row[1], cfg);
        cfg = rowlenByRange(d, row_s, row_e, cfg);
      }
  
      // 条件格式
      const cdformat = $.extend(
        true,
        [],
        ctx.luckysheetfile[getSheetIndex(ctx.currentSheetIndex)]
          .luckysheet_conditionformat_save
      );
      if (cdformat != null && cdformat.length > 0) {
        for (let i = 0; i < cdformat.length; i++) {
          const cdformat_cellrange = cdformat[i].cellrange;
          let emptyRange = [];
          for (let j = 0; j < cdformat_cellrange.length; j++) {
            const range = conditionformat.CFSplitRange(
              cdformat_cellrange[j],
              { row: last.row, column: last.column },
              { row: [row_s, row_e], column: [col_s, col_e] },
              "allPart"
            );
            emptyRange = emptyRange.concat(range);
          }
          cdformat[i].cellrange = emptyRange;
        }
      }
  
      let rf;
      if (
        ctx.luckysheet_select_save[0].row_focus ==
        ctx.luckysheet_select_save[0].row[0]
      ) {
        rf = row_s;
      } else {
        rf = row_e;
      }
  
      let cf;
      if (
        ctx.luckysheet_select_save[0].column_focus ==
        ctx.luckysheet_select_save[0].column[0]
      ) {
        cf = col_s;
      } else {
        cf = col_e;
      }
  
      const range = [];
      range.push({ row: last.row, column: last.column });
      range.push({ row: [row_s, row_e], column: [col_s, col_e] });
  
      last.row = [row_s, row_e];
      last.column = [col_s, col_e];
      last.row_focus = rf;
      last.column_focus = cf;
  
      const allParam = {
        cfg,
        RowlChange,
        cdformat,
      };
  
      jfrefreshgrid(d, range, allParam);
  
      selectHightlightShow();
  
      $("#luckysheet-sheettable").css("cursor", "default");
      clearTimeout(ctx.countfuncTimeout);
      ctx.countfuncTimeout = setTimeout(function () {
        countfunc();
      }, 500);
      */
  }

  /*
    // 图表选区拖拽移动
    if (ctx.chart_selection.rangeMove) {
      ctx.chart_selection.rangeMoveDragged();
    }
  
    // 图表选区拖拽拉伸
    if (ctx.chart_selection.rangeResize) {
      ctx.chart_selection.rangeResizeDragged();
    }
    */

  // 选区下拉
  if (ctx.luckysheet_cell_selected_extend) {
    /*
      ctx.luckysheet_cell_selected_extend = false;
      $("#luckysheet-cell-selected-extend").hide();
  
      if (
        !checkProtectionLockedRangeList(
          ctx.luckysheet_select_save,
          ctx.currentSheetIndex
        )
      ) {
        return;
      }
  
      const mouse = mouseposition(event.pageX, event.pageY);
      const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      const scrollTop = $("#luckysheet-cell-main").scrollTop();
  
      const x = mouse[0] + scrollLeft - 5;
      const y = mouse[1] + scrollTop - 5;
  
      const winH =
        $(window).height() +
        scrollTop -
        ctx.sheetBarHeight -
        ctx.statisticBarHeight;
      const winW = $(window).width() + scrollLeft;
  
      const row_location = rowLocation(y);
      const row = row_location[1];
      const row_pre = row_location[0];
      const row_index = row_location[2];
      const col_location = colLocation(x);
      const col = col_location[1];
      const col_pre = col_location[0];
      const col_index = col_location[2];
  
      const row_index_original = ctx.luckysheet_cell_selected_extend_index[0];
      const col_index_original = ctx.luckysheet_cell_selected_extend_index[1];
  
      const last =
        ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
      let row_s = last.row[0];
      let row_e = last.row[1];
      let col_s = last.column[0];
      let col_e = last.column[1];
  
      if (row_s < 0 || y < 0) {
        row_s = 0;
        row_e = last.row[1] - last.row[0];
      }
  
      if (col_s < 0 || x < 0) {
        col_s = 0;
        col_e = last.column[1] - last.column[0];
      }
  
      if (
        row_e >= ctx.visibledatarow[ctx.visibledatarow.length - 1] ||
        y > winH
      ) {
        row_s = ctx.visibledatarow.length - 1 - last.row[1] + last.row[0];
        row_e = ctx.visibledatarow.length - 1;
      }
  
      if (
        col_e >= ctx.visibledatacolumn[ctx.visibledatacolumn.length - 1] ||
        x > winW
      ) {
        col_s =
          ctx.visibledatacolumn.length - 1 - last.column[1] + last.column[0];
        col_e = ctx.visibledatacolumn.length - 1;
      }
  
      // 复制范围
      luckysheetDropCell.copyRange = {
        row: $.extend(true, [], last.row),
        column: $.extend(true, [], last.column),
      };
      // applyType
      const typeItemHide = luckysheetDropCell.typeItemHide();
  
      if (
        !typeItemHide[0] &&
        !typeItemHide[1] &&
        !typeItemHide[2] &&
        !typeItemHide[3] &&
        !typeItemHide[4] &&
        !typeItemHide[5] &&
        !typeItemHide[6]
      ) {
        luckysheetDropCell.applyType = "0";
      } else {
        luckysheetDropCell.applyType = "1";
      }
  
      if (
        Math.abs(row_index_original - row_index) >
        Math.abs(col_index_original - col_index)
      ) {
        if (!(row_index >= row_s && row_index <= row_e)) {
          if (ctx.luckysheet_select_save[0].top_move >= row_pre) {
            // 当往上拖拽时
            luckysheetDropCell.applyRange = {
              row: [row_index, last.row[0] - 1],
              column: last.column,
            };
            luckysheetDropCell.direction = "up";
  
            row_s -= last.row[0] - row_index;
  
            // 是否有数据透视表范围
            if (pivotTable.isPivotRange(row_s, col_e)) {
              tooltip.info(locale_drag.affectPivot, "");
              return;
            }
          } else {
            // 当往下拖拽时
            luckysheetDropCell.applyRange = {
              row: [last.row[1] + 1, row_index],
              column: last.column,
            };
            luckysheetDropCell.direction = "down";
  
            row_e += row_index - last.row[1];
  
            // 是否有数据透视表范围
            if (pivotTable.isPivotRange(row_e, col_e)) {
              tooltip.info(locale_drag.affectPivot, "");
              return;
            }
          }
        } else {
          return;
        }
      } else {
        if (!(col_index >= col_s && col_index <= col_e)) {
          if (ctx.luckysheet_select_save[0].left_move >= col_pre) {
            // 当往左拖拽时
            luckysheetDropCell.applyRange = {
              row: last.row,
              column: [col_index, last.column[0] - 1],
            };
            luckysheetDropCell.direction = "left";
  
            col_s -= last.column[0] - col_index;
  
            // 是否有数据透视表范围
            if (pivotTable.isPivotRange(row_e, col_s)) {
              tooltip.info(locale_drag.affectPivot, "");
              return;
            }
          } else {
            // 当往右拖拽时
            luckysheetDropCell.applyRange = {
              row: last.row,
              column: [last.column[1] + 1, col_index],
            };
            luckysheetDropCell.direction = "right";
  
            col_e += col_index - last.column[1];
  
            // 是否有数据透视表范围
            if (pivotTable.isPivotRange(row_e, col_e)) {
              tooltip.info(locale_drag.affectPivot, "");
              return;
            }
          }
        } else {
          return;
        }
      }
  
      if (ctx.config.merge != null) {
        let hasMc = false;
  
        for (let r = last.row[0]; r <= last.row[1]; r++) {
          for (let c = last.column[0]; c <= last.column[1]; c++) {
            const cell = ctx.flowdata[r][c];
  
            if (cell != null && cell.mc != null) {
              hasMc = true;
              break;
            }
          }
        }
  
        if (hasMc) {
          if (isEditMode()) {
            alert(locale_drag.noMerge);
          } else {
            tooltip.info(locale_drag.noMerge, "");
          }
  
          return;
        }
  
        for (let r = row_s; r <= row_e; r++) {
          for (let c = col_s; c <= col_e; c++) {
            const cell = ctx.flowdata[r][c];
  
            if (cell != null && cell.mc != null) {
              hasMc = true;
              break;
            }
          }
        }
  
        if (hasMc) {
          if (isEditMode()) {
            alert(locale_drag.noMerge);
          } else {
            tooltip.info(locale_drag.noMerge, "");
          }
  
          return;
        }
      }
  
      last.row = [row_s, row_e];
      last.column = [col_s, col_e];
  
      luckysheetDropCell.update();
      luckysheetDropCell.createIcon();
  
      $("#luckysheet-cell-selected-move").hide();
  
      $("#luckysheet-sheettable").css("cursor", "default");
      clearTimeout(ctx.countfuncTimeout);
      ctx.countfuncTimeout = setTimeout(function () {
        countfunc();
      }, 500);
      */
  }
}

export function handleRowHeaderMouseDown(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLDivElement,
  cellInput: HTMLDivElement,
  fxInput: HTMLDivElement
) {
  if (!checkProtectionAllSelected(ctx, ctx.currentSheetIndex)) {
    return;
  }
  // 有批注在编辑时
  removeEditingComment(ctx, globalCache);

  // 图片 active/cropping
  // if (
  //   $("#luckysheet-modal-dialog-activeImage").is(":visible") ||
  //   $("#luckysheet-modal-dialog-cropping").is(":visible")
  // ) {
  cancelActiveImgItem(ctx, globalCache);
  // }

  const rect = container.getBoundingClientRect();
  const y = e.pageY - rect.top + ctx.scrollTop;

  const row_location = rowLocation(y, ctx.visibledatarow);
  const row = row_location[1];
  const row_pre = row_location[0];
  const row_index = row_location[2];
  const col_index = ctx.visibledatacolumn.length - 1;
  const col = ctx.visibledatacolumn[col_index];
  const col_pre = 0;

  // $("#luckysheet-rightclick-menu").hide();
  // $("#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu").hide();

  // mousedown是右键
  if (e.button === 2) {
    // 如果右键在选区内, 停止mousedown处理
    let isInSelection = false;

    const flowdata = getFlowdata(ctx);
    _.forEach(ctx.luckysheet_select_save, (obj_s) => {
      if (
        obj_s.row != null &&
        row_index >= obj_s.row[0] &&
        row_index <= obj_s.row[1] &&
        obj_s.column[0] === 0 &&
        obj_s.column[1] === (flowdata?.[0]?.length ?? 0) - 1
      ) {
        isInSelection = true;
        return false;
      }
      return true;
    });
    if (isInSelection) {
      return;
    }
  }

  let top = row_pre;
  let height = row - row_pre - 1;
  let rowseleted = [row_index, row_index];

  ctx.luckysheet_scroll_status = true;

  // 公式相关

  if (!_.isEmpty(ctx.luckysheetCellUpdate)) {
    if (
      formulaCache.rangestart ||
      formulaCache.rangedrag_column_start ||
      formulaCache.rangedrag_row_start ||
      israngeseleciton()
      // ||$("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
    ) {
      // 公式选区
      let changeparam = mergeMoveMain(
        ctx,
        [0, col_index],
        rowseleted,
        { row_focus: row_index, column_focus: 0 },
        top,
        height,
        col_pre,
        col
      );
      if (changeparam != null) {
        // @ts-ignore
        [rowseleted, top, height] = [
          changeparam[1],
          changeparam[2],
          changeparam[3],
        ];
        // columnseleted = changeparam[0];
        // left = changeparam[4];
        // width = changeparam[5];
      }

      if (e.shiftKey) {
        const last = formulaCache.func_selectedrange;

        top = 0;
        height = 0;
        rowseleted = [];
        if (
          last == null ||
          last.top == null ||
          last.height == null ||
          last.row == null ||
          last.row_focus == null
        )
          return;
        if (last.top > row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;

          if (last.row[1] > last.row_focus) {
            last.row[1] = last.row_focus;
          }

          rowseleted = [row_index, last.row[1]];
        } else if (last.top === row_pre) {
          top = row_pre;
          height = last.top + last.height - row_pre;
          rowseleted = [row_index, last.row[0]];
        } else {
          top = last.top;
          height = row - last.top - 1;

          if (last.row[0] < last.row_focus) {
            last.row[0] = last.row_focus;
          }

          rowseleted = [last.row[0], row_index];
        }

        changeparam = mergeMoveMain(
          ctx,
          [0, col_index],
          rowseleted,
          { row_focus: row_index, column_focus: 0 },
          top,
          height,
          col_pre,
          col
        );
        if (changeparam != null) {
          // columnseleted = changeparam[0];
          // @ts-ignore
          [rowseleted, top, height] = [
            changeparam[1],
            changeparam[2],
            changeparam[3],
          ];
          // left = changeparam[4];
          // width = changeparam[5];
        }

        last.row = rowseleted;

        last.top_move = top;
        last.height_move = height;

        formulaCache.func_selectedrange = last;
      } else if (
        e.ctrlKey &&
        _.last(cellInput.querySelectorAll("span"))?.innerText !== ","
      ) {
        // 按住ctrl 选择选区时  先处理上一个选区
        let vText = `${cellInput.innerText},`;
        if (vText.length > 0 && vText.substring(0, 1) === "=") {
          vText = functionHTMLGenerate(vText);

          if (window.getSelection) {
            // all browsers, except IE before version 9
            const currSelection = window.getSelection();
            if (currSelection == null) return;
            formulaCache.functionRangeIndex = [
              _.indexOf(
                currSelection.anchorNode?.parentNode?.parentNode?.childNodes,
                // @ts-ignore
                currSelection.anchorNode?.parentNode
              ),
              currSelection.anchorOffset,
            ];
          } else {
            // Internet Explorer before version 9
            // @ts-ignore
            const textRange = document.selection.createRange();
            formulaCache.functionRangeIndex = textRange;
          }

          cellInput.innerHTML = vText;
          cancelFunctionrangeSelected(ctx);
          createRangeHightlight(ctx, vText);
        }

        formulaCache.rangestart = false;
        formulaCache.rangedrag_column_start = false;
        formulaCache.rangedrag_row_start = false;

        fxInput.innerHTML = vText;
        rangeHightlightselected(ctx, cellInput);

        // 再进行 选区的选择
        israngeseleciton();
        formulaCache.func_selectedrange = {
          left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
          width:
            colLocationByIndex(0, ctx.visibledatacolumn)[1] -
            colLocationByIndex(0, ctx.visibledatacolumn)[0] -
            1,
          top,
          height,
          left_move: col_pre,
          width_move: col - col_pre - 1,
          top_move: top,
          height_move: height,
          row: rowseleted,
          column: [0, col_index],
          row_focus: row_index,
          column_focus: 0,
        };
      } else {
        formulaCache.func_selectedrange = {
          left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
          width:
            colLocationByIndex(0, ctx.visibledatacolumn)[1] -
            colLocationByIndex(0, ctx.visibledatacolumn)[0] -
            1,
          top,
          height,
          left_move: col_pre,
          width_move: col - col_pre - 1,
          top_move: top,
          height_move: height,
          row: rowseleted,
          column: [0, col_index],
          row_focus: row_index,
          column_focus: 0,
        };
      }

      if (
        formulaCache.rangestart ||
        formulaCache.rangedrag_column_start ||
        formulaCache.rangedrag_row_start ||
        israngeseleciton()
      ) {
        rangeSetValue(ctx, cellInput, {
          row: rowseleted,
          column: [null, null],
        });
      }
      // else if (
      //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
      // ) {
      //   // if公式生成器
      //   const range = getRangetxt(
      //     ctx.currentSheetIndex,
      //     { row: rowseleted, column: [0, col_index] },
      //     ctx.currentSheetIndex
      //   );
      //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);
      // }

      formulaCache.rangedrag_row_start = true;
      formulaCache.rangestart = false;
      formulaCache.rangedrag_column_start = false;

      // $("#luckysheet-formula-functionrange-select")
      //   .css({
      //     left: col_pre,
      //     width: col - col_pre - 1,
      //     top,
      //     height,
      //   })
      //   .show();
      // $("#luckysheet-formula-help-c").hide();

      // luckysheet_count_show(col_pre, top, col - col_pre - 1, height, rowseleted, [
      //   0,
      //   col_index,
      // ]);

      // setTimeout(function () {
      //   const currSelection = window.getSelection();
      //   const anchorOffset = currSelection.anchorNode;

      //   let $editor;
      //   if (
      //     $("#luckysheet-search-formula-parm").is(":visible") ||
      //     $("#luckysheet-search-formula-parm-select").is(":visible")
      //   ) {
      //     $editor = $("#luckysheet-rich-text-editor");
      //     formula.rangechangeindex = formula.data_parm_index;
      //   } else {
      //     $editor = $(anchorOffset).closest("div");
      //   }

      //   const $span = $editor.find(
      //     `span[rangeindex='${formula.rangechangeindex}']`
      //   );

      //   setCaretPosition($span.get(0), 0, $span.html().length);
      // }, 1);

      return;
    }

    updateCell(
      ctx,
      ctx.luckysheetCellUpdate[0],
      ctx.luckysheetCellUpdate[1],
      cellInput
    );
    ctx.luckysheet_rows_selected_status = true;
  } else {
    ctx.luckysheet_rows_selected_status = true;
  }

  if (ctx.luckysheet_rows_selected_status) {
    if (e.shiftKey) {
      // 按住shift点击行索引选取范围
      const last = _.cloneDeep(
        ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]
      ); // 选区最后一个
      if (
        !last ||
        _.isNil(last.top) ||
        _.isNil(last.height) ||
        _.isNil(last.row_focus)
      ) {
        return;
      }

      let _top = 0;
      let _height = 0;
      let _rowseleted = [];
      if (last.top > row_pre) {
        _top = row_pre;
        _height = last.top + last.height - row_pre;

        if (last.row[1] > last.row_focus) {
          last.row[1] = last.row_focus;
        }

        _rowseleted = [row_index, last.row[1]];
      } else if (last.top === row_pre) {
        _top = row_pre;
        _height = last.top + last.height - row_pre;
        _rowseleted = [row_index, last.row[0]];
      } else {
        _top = last.top;
        _height = row - last.top - 1;

        if (last.row[0] < last.row_focus) {
          last.row[0] = last.row_focus;
        }

        _rowseleted = [last.row[0], row_index];
      }

      last.row = _rowseleted;

      last.top_move = _top;
      last.height_move = _height;

      ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1] =
        last;
    } else if (e.ctrlKey) {
      ctx.luckysheet_select_save?.push({
        left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
        width:
          colLocationByIndex(0, ctx.visibledatacolumn)[1] -
          colLocationByIndex(0, ctx.visibledatacolumn)[0] -
          1,
        top,
        height,
        left_move: col_pre,
        width_move: col - col_pre - 1,
        top_move: top,
        height_move: height,
        row: rowseleted,
        column: [0, col_index],
        row_focus: row_index,
        column_focus: 0,
        row_select: true,
      });
    } else {
      ctx.luckysheet_select_save = [];
      ctx.luckysheet_select_save.push({
        left: colLocationByIndex(0, ctx.visibledatacolumn)[0],
        width:
          colLocationByIndex(0, ctx.visibledatacolumn)[1] -
          colLocationByIndex(0, ctx.visibledatacolumn)[0] -
          1,
        top,
        height,
        left_move: col_pre,
        width_move: col - col_pre - 1,
        top_move: top,
        height_move: height,
        row: rowseleted,
        column: [0, col_index],
        row_focus: row_index,
        column_focus: 0,
        row_select: true,
      });
    }
    // selectHightlightShow();
    // 允许编辑后的后台更新时
    // server.saveParam("mv", ctx.currentSheetIndex, ctx.luckysheet_select_save);
  }
}

export function handleColumnHeaderMouseDown(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLElement,
  cellInput: HTMLDivElement,
  fxInput: HTMLDivElement
) {
  if (!checkProtectionAllSelected(ctx, ctx.currentSheetIndex)) {
    return;
  }
  // 有批注在编辑时
  removeEditingComment(ctx, globalCache);

  // 图片 active/cropping
  // if (
  //   $("#luckysheet-modal-dialog-activeImage").is(":visible") ||
  //   $("#luckysheet-modal-dialog-cropping").is(":visible")
  // ) {
  cancelActiveImgItem(ctx, globalCache);
  // }

  const rect = container.getBoundingClientRect();
  const x = e.pageX - rect.left + ctx.scrollLeft;

  const row_index = ctx.visibledatarow.length - 1;
  const row = ctx.visibledatarow[row_index];
  const row_pre = 0;
  const col_location = colLocation(x, ctx.visibledatacolumn);
  const col = col_location[1];
  const col_pre = col_location[0];
  const col_index = col_location[2];

  ctx.orderbyindex = col_index; // 排序全局函数

  // $("#luckysheet-rightclick-menu").hide();
  // $("#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu").hide();
  // $("#luckysheet-filter-menu, #luckysheet-filter-submenu").hide();

  // mousedown是右键
  if (e.button === 2) {
    let isInSelection = false;

    const flowdata = getFlowdata(ctx);
    _.forEach(ctx.luckysheet_select_save, (obj_s) => {
      // 如果右键在选区内, 停止mousedown处理
      if (
        obj_s.column != null &&
        col_index >= obj_s.column[0] &&
        col_index <= obj_s.column[1] &&
        obj_s.row[0] === 0 &&
        obj_s.row[1] === (flowdata?.length ?? 0) - 1
      ) {
        isInSelection = true;
        return false;
      }
      return true;
    });

    if (isInSelection) {
      return;
    }
  }

  let left = col_pre;
  let width = col - col_pre - 1;
  let columnseleted = [col_index, col_index];

  ctx.luckysheet_scroll_status = true;

  // 公式相关
  if (!_.isEmpty(ctx.luckysheetCellUpdate)) {
    if (
      formulaCache.rangestart ||
      formulaCache.rangedrag_column_start ||
      formulaCache.rangedrag_row_start ||
      israngeseleciton()
      //  ||
      // $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
    ) {
      // 公式选区
      let changeparam = mergeMoveMain(
        ctx,
        columnseleted,
        [0, row_index],
        { row_focus: 0, column_focus: col_index },
        row_pre,
        row,
        left,
        width
      );
      if (changeparam != null) {
        // @ts-ignore
        [columnseleted, left, width] = [
          changeparam[0],
          changeparam[4],
          changeparam[5],
        ];
      }

      if (e.shiftKey) {
        const last = formulaCache.func_selectedrange;

        left = 0;
        width = 0;
        columnseleted = [];
        if (
          last == null ||
          last.width == null ||
          last.height == null ||
          last.left == null ||
          last.column_focus == null
        )
          return;
        if (last.left > col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;

          if (last.column[1] > last.column_focus) {
            last.column[1] = last.column_focus;
          }

          columnseleted = [col_index, last.column[1]];
        } else if (last.left === col_pre) {
          left = col_pre;
          width = last.left + last.width - col_pre;
          columnseleted = [col_index, last.column[0]];
        } else {
          left = last.left;
          width = col - last.left - 1;

          if (last.column[0] < last.column_focus) {
            last.column[0] = last.column_focus;
          }

          columnseleted = [last.column[0], col_index];
        }

        changeparam = mergeMoveMain(
          ctx,
          columnseleted,
          [0, row_index],
          { row_focus: 0, column_focus: col_index },
          row_pre,
          row,
          left,
          width
        );
        if (changeparam != null) {
          // @ts-ignore
          [columnseleted, left, width] = [
            changeparam[0],
            changeparam[4],
            changeparam[5],
          ];
        }

        last.column = columnseleted;

        last.left_move = left;
        last.width_move = width;

        formulaCache.func_selectedrange = last;
      } else if (
        e.ctrlKey &&
        _.last(cellInput.querySelectorAll("span"))?.innerText !== ","
      ) {
        // 按住ctrl 选择选区时  先处理上一个选区
        let vText = `${cellInput.innerText},`;
        if (vText.length > 0 && vText.substring(0, 1) === "=") {
          vText = functionHTMLGenerate(vText);

          if (window.getSelection) {
            // all browsers, except IE before version 9
            const currSelection = window.getSelection();
            if (currSelection == null) return;
            formulaCache.functionRangeIndex = [
              _.indexOf(
                currSelection.anchorNode?.parentNode?.parentNode?.childNodes,
                // @ts-ignore
                currSelection.anchorNode?.parentNode
              ),
              currSelection.anchorOffset,
            ];
          } else {
            // Internet Explorer before version 9
            // @ts-ignore
            const textRange = document.selection.createRange();
            formulaCache.functionRangeIndex = textRange;
          }

          cellInput.innerHTML = vText;

          cancelFunctionrangeSelected(ctx);
          createRangeHightlight(ctx, vText);
        }

        formulaCache.rangestart = false;
        formulaCache.rangedrag_column_start = false;
        formulaCache.rangedrag_row_start = false;

        fxInput.innerHTML = vText;
        rangeHightlightselected(ctx, cellInput);

        // 再进行 选区的选择
        israngeseleciton();
        formulaCache.func_selectedrange = {
          left,
          width,
          top: rowLocationByIndex(0, ctx.visibledatarow)[0],
          height:
            rowLocationByIndex(0, ctx.visibledatarow)[1] -
            rowLocationByIndex(0, ctx.visibledatarow)[0] -
            1,
          left_move: left,
          width_move: width,
          top_move: row_pre,
          height_move: row - row_pre - 1,
          row: [0, row_index],
          column: columnseleted,
          row_focus: 0,
          column_focus: col_index,
        };
      } else {
        formulaCache.func_selectedrange = {
          left,
          width,
          top: rowLocationByIndex(0, ctx.visibledatarow)[0],
          height:
            rowLocationByIndex(0, ctx.visibledatarow)[1] -
            rowLocationByIndex(0, ctx.visibledatarow)[0] -
            1,
          left_move: left,
          width_move: width,
          top_move: row_pre,
          height_move: row - row_pre - 1,
          row: [0, row_index],
          column: columnseleted,
          row_focus: 0,
          column_focus: col_index,
        };
      }

      if (
        formulaCache.rangestart ||
        formulaCache.rangedrag_column_start ||
        formulaCache.rangedrag_row_start ||
        israngeseleciton()
      ) {
        rangeSetValue(ctx, cellInput, {
          row: [null, null],
          column: columnseleted,
        });
      }
      // else if (
      //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
      // ) {
      //   // if公式生成器
      //   const range = getRangetxt(
      //     ctx.currentSheetIndex,
      //     { row: [0, row_index], column: columnseleted },
      //     ctx.currentSheetIndex
      //   );
      //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);
      // }

      formulaCache.rangedrag_column_start = true;
      formulaCache.rangestart = false;
      formulaCache.rangedrag_row_start = false;

      // $("#luckysheet-formula-functionrange-select")
      //   .css({
      //     left,
      //     width,
      //     top: row_pre,
      //     height: row - row_pre - 1,
      //   })
      //   .show();
      // $("#luckysheet-formula-help-c").hide();

      // luckysheet_count_show(
      //   left,
      //   row_pre,
      //   width,
      //   row - row_pre - 1,
      //   [0, row_index],
      //   columnseleted
      // );

      return;
    }
    updateCell(
      ctx,
      ctx.luckysheetCellUpdate[0],
      ctx.luckysheetCellUpdate[1],
      cellInput
    );
    ctx.luckysheet_cols_selected_status = true;
  } else {
    ctx.luckysheet_cols_selected_status = true;
  }

  if (ctx.luckysheet_cols_selected_status) {
    if (e.shiftKey) {
      // 按住shift点击列索引选取范围
      const last = _.cloneDeep(
        ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]
      ); // 选区最后一个

      let _left = 0;
      let _width = 0;
      let _columnseleted = [];

      if (
        !last ||
        _.isNil(last.left) ||
        _.isNil(last.width) ||
        _.isNil(last.column_focus)
      ) {
        return;
      }

      if (last.left > col_pre) {
        _left = col_pre;
        _width = last.left + last.width - col_pre;

        if (last.column[1] > last.column_focus) {
          last.column[1] = last.column_focus;
        }

        _columnseleted = [col_index, last.column[1]];
      } else if (last.left === col_pre) {
        _left = col_pre;
        _width = last.left + last.width - col_pre;
        _columnseleted = [col_index, last.column[0]];
      } else {
        _left = last.left;
        _width = col - last.left - 1;

        if (last.column[0] < last.column_focus) {
          last.column[0] = last.column_focus;
        }

        _columnseleted = [last.column[0], col_index];
      }

      last.column = _columnseleted;

      last.left_move = _left;
      last.width_move = _width;

      ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1] =
        last;
    } else if (e.ctrlKey) {
      // 选区添加
      ctx.luckysheet_select_save?.push({
        left,
        width,
        top: rowLocationByIndex(0, ctx.visibledatarow)[0],
        height:
          rowLocationByIndex(0, ctx.visibledatarow)[1] -
          rowLocationByIndex(0, ctx.visibledatarow)[0] -
          1,
        left_move: left,
        width_move: width,
        top_move: row_pre,
        height_move: row - row_pre - 1,
        row: [0, row_index],
        column: columnseleted,
        row_focus: 0,
        column_focus: col_index,
        column_select: true,
      });
    } else {
      ctx.luckysheet_select_save = [];
      ctx.luckysheet_select_save.push({
        left,
        width,
        top: rowLocationByIndex(0, ctx.visibledatarow)[0],
        height:
          rowLocationByIndex(0, ctx.visibledatarow)[1] -
          rowLocationByIndex(0, ctx.visibledatarow)[0] -
          1,
        left_move: left,
        width_move: width,
        top_move: row_pre,
        height_move: row - row_pre - 1,
        row: [0, row_index],
        column: columnseleted,
        row_focus: 0,
        column_focus: col_index,
        column_select: true,
      });
    }

    // selectHightlightShow();

    // // 允许编辑后的后台更新时
    // server.saveParam("mv", ctx.currentSheetIndex, ctx.luckysheet_select_save);
  }
}

export function handleColSizeHandleMouseDown(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  headerContainer: HTMLDivElement,
  cellArea: HTMLDivElement
) {
  // //有批注在编辑时
  removeEditingComment(ctx, globalCache);

  // //图片 active/cropping
  // if (
  //   $("#luckysheet-modal-dialog-activeImage").is(":visible") ||
  //   $("#luckysheet-modal-dialog-cropping").is(":visible")
  // ) {
  cancelActiveImgItem(ctx, globalCache);
  // }

  ctx.luckysheetCellUpdate = [];

  // let mouse = mouseposition(event.pageX, event.pageY);
  const { scrollLeft } = ctx;
  const { scrollTop } = ctx;

  const x = e.pageX - headerContainer.getBoundingClientRect().left + scrollLeft;

  const col_location = colLocation(x, ctx.visibledatacolumn);
  const col = col_location[1];
  const col_pre = col_location[0];
  const col_index = col_location[2];

  ctx.luckysheet_cols_change_size = true;
  ctx.luckysheet_scroll_status = true;
  const changeSizeLine = document.querySelector(".luckysheet-change-size-line");
  if (changeSizeLine) {
    const ele = changeSizeLine as HTMLDivElement;
    ele.style.height = `${
      cellArea.getBoundingClientRect().height + scrollTop
    }px`;
    ele.style.borderWidth = "0 1px 0 0";
    ele.style.top = "0";
    ele.style.left = `${col - 3}px`;
    ele.style.width = "1px";
  }
  // $(
  //   "#luckysheet-sheettable, #luckysheet-cols-h-c, .luckysheet-cols-h-cells, .luckysheet-cols-h-cells canvas"
  // ).css("cursor", "ew-resize");
  ctx.luckysheet_cols_change_size_start = [col_pre, col_index];
  // $("#luckysheet-rightclick-menu").hide();
  // $("#luckysheet-cols-h-hover").hide();
  // $("#luckysheet-cols-menu-btn").hide();
  ctx.luckysheet_cols_dbclick_times = 0;
  e.stopPropagation();
}

export function handleRowSizeHandleMouseDown(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  headerContainer: HTMLDivElement,
  cellArea: HTMLDivElement
) {
  // 有批注在编辑时
  removeEditingComment(ctx, globalCache);

  // //图片 active/cropping
  // if (
  //   $("#luckysheet-modal-dialog-activeImage").is(":visible") ||
  //   $("#luckysheet-modal-dialog-cropping").is(":visible")
  // ) {
  cancelActiveImgItem(ctx, globalCache);
  // }

  ctx.luckysheetCellUpdate = [];

  // let mouse = mouseposition(event.pageX, event.pageY);
  const { scrollLeft } = ctx;
  const { scrollTop } = ctx;

  const y = e.pageY - headerContainer.getBoundingClientRect().top + scrollTop;

  const row_location = rowLocation(y, ctx.visibledatarow);
  const row = row_location[1];
  const row_pre = row_location[0];
  const row_index = row_location[2];

  ctx.luckysheet_rows_change_size = true;
  ctx.luckysheet_scroll_status = true;
  const changeSizeLine = document.querySelector(".luckysheet-change-size-line");
  if (changeSizeLine) {
    const ele = changeSizeLine as HTMLDivElement;
    ele.style.width = `${
      cellArea.getBoundingClientRect().width + scrollLeft
    }px`;
    ele.style.borderWidth = "0 0 1px 0";
    ele.style.top = `${row - 3}px`;
    ele.style.left = "0";
    ele.style.height = "1px";
  }
  // $(
  //   "#luckysheet-sheettable, #luckysheet-cols-h-c, .luckysheet-cols-h-cells, .luckysheet-cols-h-cells canvas"
  // ).css("cursor", "ew-resize");
  ctx.luckysheet_rows_change_size_start = [row_pre, row_index];
  // $("#luckysheet-rightclick-menu").hide();
  // $("#luckysheet-cols-h-hover").hide();
  // $("#luckysheet-cols-menu-btn").hide();
  e.stopPropagation();
}
