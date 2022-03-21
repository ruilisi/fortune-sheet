import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { mergeBorder, updateCell } from "../modules/cell";
import { colLocation, rowLocation } from "../modules/location";
import { normalizeSelection } from "../modules/selection";
import { Settings } from "../settings";
import { Selection } from "../types";

export function handleGlobalWheel(ctx: Context, e: WheelEvent) {
  let { scrollLeft } = ctx;
  const { scrollTop } = ctx;
  let visibledatacolumn_c = ctx.visibledatacolumn;
  let visibledatarow_c = ctx.visibledatarow;

  // if (luckysheetFreezen.freezenhorizontaldata != null) {
  //   visibledatarow_c = luckysheetFreezen.freezenhorizontaldata[3];
  // }

  // if (luckysheetFreezen.freezenverticaldata != null) {
  //   visibledatacolumn_c = luckysheetFreezen.freezenverticaldata[3];
  // }

  // clearTimeout(mousewheelArrayUniqueTimeout);

  // if(ctx.visibledatacolumn.length!=visibledatacolumn_c.length){
  if (ctx.visibledatacolumn_unique != null) {
    visibledatacolumn_c = ctx.visibledatacolumn_unique;
  } else {
    visibledatacolumn_c = _.uniq(visibledatacolumn_c);
    ctx.visibledatacolumn_unique = visibledatacolumn_c;
  }
  // }

  // if(ctx.visibledatarow.length!=visibledatarow_c.length){
  if (ctx.visibledatarow_unique != null) {
    visibledatarow_c = ctx.visibledatarow_unique;
  } else {
    visibledatarow_c = _.uniq(visibledatarow_c);
    ctx.visibledatarow_unique = visibledatarow_c;
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

    ctx.scrollTop = Math.max(rowscroll, 0);
    // scrollbarY.scrollTop = rowscroll;
  } else if (e.deltaX !== 0) {
    if (e.deltaX > 0) {
      scrollLeft += 20 * ctx.zoomRatio;
    } else {
      scrollLeft -= 20 * ctx.zoomRatio;
    }
    ctx.scrollLeft = Math.max(scrollLeft, 0);
    // scrollbarY.scrollLeft = scrollLeft;
  }

  // mousewheelArrayUniqueTimeout = setTimeout(() => {
  //   ctx.visibledatacolumn_unique = null;
  //   ctx.visibledatarow_unique = null;
  // }, 500);
  e.preventDefault();
}

export function handleCellAreaMouseDown(
  ctx: Context,
  e: MouseEvent,
  cellInput: HTMLDivElement
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  // TODO set MouseDown state to context
  // const mouse = mousePosition(
  //   e.nativeEvent.offsetX,
  //   e.nativeEvent.offsetY,
  //   context
  // );
  // if (mouse[0] >= Store.cellmainWidth - Store.cellMainSrollBarSize || mouse[1] >= Store.cellmainHeight - Store.cellMainSrollBarSize) {
  //   return;
  // }
  const x = e.offsetX + ctx.scrollLeft;
  const y = e.offsetY + ctx.scrollTop;

  // if (
  //   luckysheetFreezen.freezenverticaldata != null &&
  //   mouse[0] <
  //     luckysheetFreezen.freezenverticaldata[0] -
  //       luckysheetFreezen.freezenverticaldata[2]
  // ) {
  //   x = mouse[0] + luckysheetFreezen.freezenverticaldata[2];
  // }

  // if (
  //   luckysheetFreezen.freezenhorizontaldata != null &&
  //   mouse[1] <
  //     luckysheetFreezen.freezenhorizontaldata[0] -
  //       luckysheetFreezen.freezenhorizontaldata[2]
  // ) {
  //   y = mouse[1] + luckysheetFreezen.freezenhorizontaldata[2];
  // }
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

  let selection: Selection[];

  // //单元格单击之前
  // if (
  //   !method.createHookFunction(
  //     "cellMousedownBefore",
  //     Store.flowdata[row_index][col_index],
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
  // if (col_pre < $("#luckysheet-cell-main").scrollLeft()) {
  //   $("#luckysheet-scrollbar-x").scrollLeft(col_pre);
  // }

  // if (row_pre < $("#luckysheet-cell-main").scrollTop()) {
  //   $("#luckysheet-scrollbar-y").scrollTop(row_pre);
  // }

  // //mousedown是右键
  // if (event.which == "3") {
  //   $("#luckysheet-dataVerification-showHintBox").hide();

  //   let isright = false;

  //   for (let s = 0; s < Store.luckysheet_select_save.length; s++) {
  //     if (
  //       Store.luckysheet_select_save[s]["row"] != null &&
  //       row_index >= Store.luckysheet_select_save[s]["row"][0] &&
  //       row_index <= Store.luckysheet_select_save[s]["row"][1] &&
  //       col_index >= Store.luckysheet_select_save[s]["column"][0] &&
  //       col_index <= Store.luckysheet_select_save[s]["column"][1]
  //     ) {
  //       isright = true;
  //       break;
  //     }
  //   }

  //   if (isright) {
  //     return;
  //   }
  // }

  // //单元格数据下钻
  // if (
  //   Store.flowdata[row_index] != null &&
  //   Store.flowdata[row_index][col_index] != null &&
  //   Store.flowdata[row_index][col_index].dd != null
  // ) {
  //   if (
  //     luckysheetConfigsetting.fireMousedown != null &&
  //     getObjType(luckysheetConfigsetting.fireMousedown) == "function"
  //   ) {
  //     luckysheetConfigsetting.fireMousedown(
  //       Store.flowdata[row_index][col_index].dd
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

  // Store.luckysheet_scroll_status = true;

  // 公式相关
  if (ctx.luckysheetCellUpdate.length > 0) {
    //   if (
    //     formula.rangestart ||
    //     formula.rangedrag_column_start ||
    //     formula.rangedrag_row_start ||
    //     formula.israngeseleciton()
    //   ) {
    //     //公式选区
    //     let rowseleted = [row_index, row_index_ed];
    //     let columnseleted = [col_index, col_index_ed];

    //     let left = col_pre;
    //     let width = col - col_pre - 1;
    //     let top = row_pre;
    //     let height = row - row_pre - 1;

    //     if (event.shiftKey) {
    //       let last = formula.func_selectedrange;

    //       let top = 0,
    //         height = 0,
    //         rowseleted = [];
    //       if (last.top > row_pre) {
    //         top = row_pre;
    //         height = last.top + last.height - row_pre;

    //         if (last.row[1] > last.row_focus) {
    //           last.row[1] = last.row_focus;
    //         }

    //         rowseleted = [row_index, last.row[1]];
    //       } else if (last.top == row_pre) {
    //         top = row_pre;
    //         height = last.top + last.height - row_pre;
    //         rowseleted = [row_index, last.row[0]];
    //       } else {
    //         top = last.top;
    //         height = row - last.top - 1;

    //         if (last.row[0] < last.row_focus) {
    //           last.row[0] = last.row_focus;
    //         }

    //         rowseleted = [last.row[0], row_index];
    //       }

    //       let left = 0,
    //         width = 0,
    //         columnseleted = [];
    //       if (last.left > col_pre) {
    //         left = col_pre;
    //         width = last.left + last.width - col_pre;

    //         if (last.column[1] > last.column_focus) {
    //           last.column[1] = last.column_focus;
    //         }

    //         columnseleted = [col_index, last.column[1]];
    //       } else if (last.left == col_pre) {
    //         left = col_pre;
    //         width = last.left + last.width - col_pre;
    //         columnseleted = [col_index, last.column[0]];
    //       } else {
    //         left = last.left;
    //         width = col - last.left - 1;

    //         if (last.column[0] < last.column_focus) {
    //           last.column[0] = last.column_focus;
    //         }

    //         columnseleted = [last.column[0], col_index];
    //       }

    //       let changeparam = menuButton.mergeMoveMain(
    //         columnseleted,
    //         rowseleted,
    //         last,
    //         top,
    //         height,
    //         left,
    //         width
    //       );
    //       if (changeparam != null) {
    //         columnseleted = changeparam[0];
    //         rowseleted = changeparam[1];
    //         top = changeparam[2];
    //         height = changeparam[3];
    //         left = changeparam[4];
    //         width = changeparam[5];
    //       }

    //       luckysheet_count_show(
    //         left,
    //         top,
    //         width,
    //         height,
    //         rowseleted,
    //         columnseleted
    //       );

    //       last["row"] = rowseleted;
    //       last["column"] = columnseleted;

    //       last["left_move"] = left;
    //       last["width_move"] = width;
    //       last["top_move"] = top;
    //       last["height_move"] = height;

    //       formula.func_selectedrange = last;
    //     } else if (
    //       event.ctrlKey &&
    //       $("#luckysheet-rich-text-editor").find("span").last().text() != ","
    //     ) {
    //       //按住ctrl 选择选区时  先处理上一个选区
    //       let vText = $("#luckysheet-rich-text-editor").text();

    //       if (vText[vText.length - 1] === ")") {
    //         vText = vText.substr(0, vText.length - 1); //先删除最后侧的圆括号)
    //       }

    //       if (vText.length > 0) {
    //         let lastWord = vText.substr(vText.length - 1, 1);
    //         if (lastWord != "," && lastWord != "=" && lastWord != "(") {
    //           vText += ",";
    //         }
    //       }
    //       if (vText.length > 0 && vText.substr(0, 1) == "=") {
    //         vText = formula.functionHTMLGenerate(vText);

    //         if (window.getSelection) {
    //           // all browsers, except IE before version 9
    //           let currSelection = window.getSelection();
    //           formula.functionRangeIndex = [
    //             $(currSelection.anchorNode).parent().index(),
    //             currSelection.anchorOffset,
    //           ];
    //         } else {
    //           // Internet Explorer before version 9
    //           let textRange = document.selection.createRange();
    //           formula.functionRangeIndex = textRange;
    //         }

    //         /* 在显示前重新 + 右侧的圆括号) */

    //         $("#luckysheet-rich-text-editor").html(vText + ")");

    //         formula.canceFunctionrangeSelected();
    //         formula.createRangeHightlight();
    //       }

    //       formula.rangestart = false;
    //       formula.rangedrag_column_start = false;
    //       formula.rangedrag_row_start = false;

    //       $("#luckysheet-functionbox-cell").html(vText + ")");
    //       formula.rangeHightlightselected($("#luckysheet-rich-text-editor"));

    //       //再进行 选区的选择
    //       formula.israngeseleciton();
    //       formula.func_selectedrange = {
    //         left: left,
    //         width: width,
    //         top: top,
    //         height: height,
    //         left_move: left,
    //         width_move: width,
    //         top_move: top,
    //         height_move: height,
    //         row: rowseleted,
    //         column: columnseleted,
    //         row_focus: row_index,
    //         column_focus: col_index,
    //       };
    //     } else {
    //       formula.func_selectedrange = {
    //         left: left,
    //         width: width,
    //         top: top,
    //         height: height,
    //         left_move: left,
    //         width_move: width,
    //         top_move: top,
    //         height_move: height,
    //         row: rowseleted,
    //         column: columnseleted,
    //         row_focus: row_index,
    //         column_focus: col_index,
    //       };
    //     }

    //     formula.rangeSetValue({ row: rowseleted, column: columnseleted });

    //     formula.rangestart = true;
    //     formula.rangedrag_column_start = false;
    //     formula.rangedrag_row_start = false;

    //     $("#luckysheet-formula-functionrange-select")
    //       .css({
    //         left: left,
    //         width: width,
    //         top: top,
    //         height: height,
    //       })
    //       .show();
    //     $("#luckysheet-formula-help-c").hide();
    //     luckysheet_count_show(
    //       left,
    //       top,
    //       width,
    //       height,
    //       rowseleted,
    //       columnseleted
    //     );

    //     setTimeout(function () {
    //       let currSelection = window.getSelection();
    //       let anchorOffset = currSelection.anchorNode;

    //       let $editor;
    //       if (
    //         $("#luckysheet-search-formula-parm").is(":visible") ||
    //         $("#luckysheet-search-formula-parm-select").is(":visible")
    //       ) {
    //         $editor = $("#luckysheet-rich-text-editor");
    //         formula.rangechangeindex = formula.data_parm_index;
    //       } else {
    //         $editor = $(anchorOffset).closest("div");
    //       }

    //       let $span = $editor.find(
    //         "span[rangeindex='" + formula.rangechangeindex + "']"
    //       );

    //       formula.setCaretPosition($span.get(0), 0, $span.html().length);
    //     }, 1);
    //     return;
    //   } else {
    updateCell(
      ctx,
      ctx.luckysheetCellUpdate[0],
      ctx.luckysheetCellUpdate[1],
      cellInput
    );
    ctx.luckysheet_select_status = true;
    //     formula.updatecell(
    //       Store.luckysheetCellUpdate[0],
    //       Store.luckysheetCellUpdate[1]
    //     );
    //     Store.luckysheet_select_status = true;

    //     if ($("#luckysheet-info").is(":visible")) {
    //       Store.luckysheet_select_status = false;
    //     }
    //   }
  } else {
    // if (
    //   checkProtectionSelectLockedOrUnLockedCells(
    //     row_index,
    //     col_index,
    //     Store.currentSheetIndex
    //   )
    // ) {
    //   Store.luckysheet_select_status = true;
    // }
  }

  // //条件格式 应用范围可选择多个单元格
  // if ($("#luckysheet-multiRange-dialog").is(":visible")) {
  //   conditionformat.selectStatus = true;
  //   Store.luckysheet_select_status = false;

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
  //   Store.luckysheet_select_status = false;

  //   selectionCopyShow([
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //   ]);

  //   let range = getRangetxt(
  //     Store.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     Store.currentSheetIndex
  //   );
  //   $("#luckysheet-singleRange-dialog input").val(range);

  //   return;
  // }

  // //数据验证 单元格范围选择
  // if ($("#luckysheet-dataVerificationRange-dialog").is(":visible")) {
  //   dataVerificationCtrl.selectStatus = true;
  //   Store.luckysheet_select_status = false;

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
  //   if (formula.rangetosheet != Store.currentSheetIndex) {
  //     range =
  //       Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].name +
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
  //   Store.luckysheet_select_status = false;
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
  //     Store.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     Store.currentSheetIndex
  //   );
  //   $("#luckysheet-ifFormulaGenerator-singleRange-dialog input").val(range);

  //   return;
  // }
  // if (
  //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")
  // ) {
  //   //选择范围
  //   Store.luckysheet_select_status = false;
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
  //     Store.currentSheetIndex,
  //     { row: [row_index, row_index], column: [col_index, col_index] },
  //     Store.currentSheetIndex
  //   );
  //   $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);

  //   $("#luckysheet-row-count-show").hide();
  //   $("#luckysheet-column-count-show").hide();

  //   return;
  // }

  // if (Store.luckysheet_select_status) {
  // if (e.shiftKey) {
  //   // 按住shift点击，选择范围
  //   const last = $.extend(
  //     true,
  //     {},
  //     Store.luckysheet_select_save[
  //       Store.luckysheet_select_save.length - 1
  //     ]
  //   ); // 选区最后一个

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

  //   Store.luckysheet_select_save[
  //     Store.luckysheet_select_save.length - 1
  //   ] = last;

  //   // 交替颜色选择范围
  //   if ($("#luckysheet-alternateformat-rangeDialog").is(":visible")) {
  //     $("#luckysheet-alternateformat-rangeDialog input").val(
  //       getRangetxt(Store.currentSheetIndex, Store.luckysheet_select_save)
  //     );
  //   }

  //   if (pivotTable.luckysheet_pivotTable_select_state) {
  //     $("#luckysheet-pivotTable-range-selection-input").val(
  //       `${
  //         Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)]
  //           .name
  //       }!${chatatABC(Store.luckysheet_select_save[0].column[0])}${
  //         Store.luckysheet_select_save[0].row[0] + 1
  //       }:${chatatABC(Store.luckysheet_select_save[0].column[1])}${
  //         Store.luckysheet_select_save[0].row[1] + 1
  //       }`
  //     );
  //   }
  // } else if (e.ctrlKey) {
  //   // 选区添加
  //   Store.luckysheet_select_save.push({
  //     left: col_pre,
  //     width: col - col_pre - 1,
  //     top: row_pre,
  //     height: row - row_pre - 1,
  //     left_move: col_pre,
  //     width_move: col - col_pre - 1,
  //     top_move: row_pre,
  //     height_move: row - row_pre - 1,
  //     row: [row_index, row_index_ed],
  //     column: [col_index, col_index_ed],
  //     row_focus: row_index,
  //     column_focus: col_index,
  //   });
  // } else {
  selection = [
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
  //   menuButton.menuButtonFocus(Store.flowdata, row_index, col_index);
  //   // 函数公式显示栏
  //   formula.fucntionboxshow(row_index, col_index);
  // }

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
  //     Store.currentSheetIndex,
  //     Store.luckysheet_select_save
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
  // pivotTable.pivotclick(row_index, col_index, Store.currentSheetIndex);

  // luckysheetContainerFocus();

  // method.createHookFunction(
  //   "cellMousedown",
  //   Store.flowdata[row_index][col_index],
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
  ctx.luckysheet_select_save = normalizeSelection(ctx, selection);
}

export function handleCellAreaDoubleClick(
  ctx: Context,
  settings: Settings,
  e: MouseEvent
) {
  // if ($(event.target).hasClass("luckysheet-mousedown-cancel")) {
  //   return;
  // }
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  // 禁止前台编辑(只可 框选单元格、滚动查看表格)
  if (!settings.allowEdit || settings.editMode) {
    return;
  }

  // if (parseInt($("#luckysheet-input-box").css("top")) > 0) {
  //   return;
  // }

  // const mouse = mouseposition(event.pageX, event.pageY);
  // if (
  //   mouse[0] >= ctx.cellmainWidth - Store.cellMainSrollBarSize ||
  //   mouse[1] >= Store.cellmainHeight - Store.cellMainSrollBarSize
  // ) {
  //   return;
  // }

  // const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  // const scrollTop = $("#luckysheet-cell-main").scrollTop();
  // let x = mouse[0] + scrollLeft;
  // let y = mouse[1] + scrollTop;

  const x = e.offsetX + ctx.scrollLeft;
  const y = e.offsetY + ctx.scrollTop;

  /*
      if (
        luckysheetFreezen.freezenverticaldata != null &&
        mouse[0] <
          luckysheetFreezen.freezenverticaldata[0] -
            luckysheetFreezen.freezenverticaldata[2]
      ) {
        x = mouse[0] + luckysheetFreezen.freezenverticaldata[2];
      }

      if (
        luckysheetFreezen.freezenhorizontaldata != null &&
        mouse[1] <
          luckysheetFreezen.freezenhorizontaldata[0] -
            luckysheetFreezen.freezenhorizontaldata[2]
      ) {
        y = mouse[1] + luckysheetFreezen.freezenhorizontaldata[2];
      }
      */

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

  ctx.luckysheetCellUpdate = [row_index, col_index];
  // }
}
