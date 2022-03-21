import React, { useContext, useCallback, useRef, useEffect } from "react";
import "./index.css";
import produce from "immer";
import {
  colLocation,
  rowLocation,
} from "@fortune-sheet/core/src/modules/location";
import { mergeBorder, updateCell } from "@fortune-sheet/core/src/modules/cell";
import { normalizeSelection } from "@fortune-sheet/core/src/modules/selection";
import { getFlowdata } from "@fortune-sheet/core/src/context";
import type { Sheet as SheetType } from "@fortune-sheet/core/src/types";
import WorkbookContext from "../../context";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import InputBox from "./InputBox";
import ScrollBar from "./ScrollBar";
import _ from "lodash";

const SheetOverlay: React.FC = () => {
  const { context, setContext, setContextValue, settings, refs } =
    useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellAreaRef = useRef<HTMLDivElement>(null);

  const cellAreaOnMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      const flowdata = getFlowdata(context);
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
      const x = e.nativeEvent.offsetX + cellAreaRef.current!.scrollLeft;
      const y = e.nativeEvent.offsetY + cellAreaRef.current!.scrollTop;

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
      const row_location = rowLocation(y, context.visibledatarow);
      let row = row_location[1];
      let row_pre = row_location[0];
      let row_index = row_location[2];

      const col_location = colLocation(x, context.visibledatacolumn);
      let col = col_location[1];
      let col_pre = col_location[0];
      let col_index = col_location[2];

      let row_index_ed = row_index;
      let col_index_ed = col_index;
      const margeset = mergeBorder(context, flowdata, row_index, col_index);
      if (margeset) {
        [row_pre, row, row_index, row_index_ed] = margeset.row;
        [col_pre, col, col_index, col_index_ed] = margeset.column;
      }

      let selection: SheetType["luckysheet_select_save"];

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
      if (context.luckysheetCellUpdate.length > 0) {
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
        setContext(
          produce((draftCtx) => {
            updateCell(
              draftCtx,
              context.luckysheetCellUpdate[0],
              context.luckysheetCellUpdate[1],
              refs.cellInput.current!
            );
            draftCtx.luckysheet_select_status = true;
          })
        );
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
      setContextValue(
        "luckysheet_select_save",
        normalizeSelection(context, selection)
      );
    },
    [context, refs.cellInput, setContext, setContextValue]
  );

  const cellAreaDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // if ($(event.target).hasClass("luckysheet-mousedown-cancel")) {
      //   return;
      // }
      if (e.target !== e.currentTarget) {
        return;
      }
      const flowdata = getFlowdata(context);
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
      //   mouse[0] >= context.cellmainWidth - Store.cellMainSrollBarSize ||
      //   mouse[1] >= Store.cellmainHeight - Store.cellMainSrollBarSize
      // ) {
      //   return;
      // }

      // const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
      // const scrollTop = $("#luckysheet-cell-main").scrollTop();
      // let x = mouse[0] + scrollLeft;
      // let y = mouse[1] + scrollTop;

      const x = e.nativeEvent.offsetX + cellAreaRef.current!.scrollLeft;
      const y = e.nativeEvent.offsetY + cellAreaRef.current!.scrollTop;

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

      const row_location = rowLocation(y, context.visibledatarow);
      let row_index = row_location[2];

      const col_location = colLocation(x, context.visibledatacolumn);
      let col_index = col_location[2];

      const margeset = mergeBorder(context, flowdata, row_index, col_index);
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
      const { column_focus, row_focus } = context.luckysheet_select_save![0];
      if (
        !_.isNil(column_focus) &&
        !_.isNil(row_focus) &&
        (column_focus !== col_index || row_focus !== row_index)
      ) {
        row_index = row_focus;
        col_index = column_focus;
      }

      setContextValue("luckysheetCellUpdate", [row_index, col_index]);
      // }
    },
    [context, setContextValue, settings.allowEdit, settings.editMode]
  );

  useEffect(() => {
    cellAreaRef.current!.scrollLeft = context.scrollLeft;
    cellAreaRef.current!.scrollTop = context.scrollTop;
  }, [context.scrollLeft, context.scrollTop]);

  return (
    <div
      className="fortune-sheet-overlay"
      ref={containerRef}
      tabIndex={-1}
      style={{
        width: context.luckysheetTableContentHW[0],
        height: context.luckysheetTableContentHW[1],
      }}
    >
      <div className="fortune-col-header-wrap">
        <div
          className="fortune-left-top"
          style={{
            width: context.rowHeaderWidth - 1.5,
            height: context.columnHeaderHeight - 1.5,
          }}
        />
        <ColumnHeader />
      </div>
      <div className="fortune-row-body">
        <RowHeader />
        <ScrollBar axis="x" />
        <ScrollBar axis="y" />
        <div
          ref={cellAreaRef}
          onMouseDown={cellAreaOnMouseDown}
          onDoubleClick={cellAreaDoubleClick}
          className="fortune-cell-area"
          style={{
            width: context.cellmainWidth,
            height: context.cellmainHeight,
          }}
        >
          <div id="luckysheet-formula-functionrange" />
          <div
            id="luckysheet-formula-functionrange-select"
            className="luckysheet-selection-copy luckysheet-formula-functionrange-select"
          >
            <div className="luckysheet-selection-copy-top luckysheet-copy" />
            <div className="luckysheet-selection-copy-right luckysheet-copy" />
            <div className="luckysheet-selection-copy-bottom luckysheet-copy" />
            <div className="luckysheet-selection-copy-left luckysheet-copy" />
            <div className="luckysheet-selection-copy-hc" />
          </div>
          <div
            className="luckysheet-row-count-show luckysheet-count-show"
            id="luckysheet-row-count-show"
          />
          <div
            className="luckysheet-column-count-show luckysheet-count-show"
            id="luckysheet-column-count-show"
          />
          <div
            className="luckysheet-change-size-line"
            id="luckysheet-change-size-line"
          />
          <div
            className="luckysheet-cell-selected-focus"
            id="luckysheet-cell-selected-focus"
          />
          <div id="luckysheet-selection-copy" />
          <div id="luckysheet-chart-rangeShow" />
          <div
            className="luckysheet-cell-selected-extend"
            id="luckysheet-cell-selected-extend"
          />
          <div
            className="luckysheet-cell-selected-move"
            id="luckysheet-cell-selected-move"
          />
          {(context.luckysheet_select_save?.length ?? 0) > 0 && (
            <div id="luckysheet-cell-selected-boxs">
              {context.luckysheet_select_save!.map((selection, index) => (
                <div
                  key={index}
                  id="luckysheet-cell-selected"
                  className="luckysheet-cell-selected"
                  style={{
                    left: selection.left_move,
                    width: selection.width_move,
                    top: selection.top_move,
                    height: selection.height_move,
                    display: "block",
                    border: "1px solid #0188fb",
                  }}
                >
                  <div className="luckysheet-cs-inner-border" />
                  <div className="luckysheet-cs-fillhandle" />
                  <div className="luckysheet-cs-inner-border" />
                  <div className="luckysheet-cs-draghandle-top luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-bottom luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-left luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-draghandle-right luckysheet-cs-draghandle" />
                  <div className="luckysheet-cs-touchhandle luckysheet-cs-touchhandle-lt">
                    <div className="luckysheet-cs-touchhandle-btn" />
                  </div>
                  <div className="luckysheet-cs-touchhandle luckysheet-cs-touchhandle-rb">
                    <div className="luckysheet-cs-touchhandle-btn" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <InputBox />
          <div id="luckysheet-postil-showBoxs" />
          <div id="luckysheet-multipleRange-show" />
          <div id="luckysheet-dynamicArray-hightShow" />
          <div id="luckysheet-image-showBoxs">
            <div
              id="luckysheet-modal-dialog-activeImage"
              className="luckysheet-modal-dialog"
              style={{
                display: "none",
                padding: 0,
                position: "absolute",
                zIndex: 300,
              }}
            >
              <div
                className="luckysheet-modal-dialog-border"
                style={{ position: "absolute" }}
              />
              <div className="luckysheet-modal-dialog-content" />
              <div className="luckysheet-modal-dialog-resize">
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lt"
                  data-type="lt"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mt"
                  data-type="mt"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lm"
                  data-type="lm"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rm"
                  data-type="rm"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rt"
                  data-type="rt"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lb"
                  data-type="lb"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mb"
                  data-type="mb"
                />
                <div
                  className="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rb"
                  data-type="rb"
                />
              </div>
              <div className="luckysheet-modal-dialog-controll">
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
                  role="button"
                  tabIndex={0}
                  aria-label="裁剪"
                  title="裁剪"
                >
                  <i className="fa fa-pencil" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
                  role="button"
                  tabIndex={0}
                  aria-label="恢复原图"
                  title="恢复原图"
                >
                  <i className="fa fa-window-maximize" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
                  role="button"
                  tabIndex={0}
                  aria-label="删除"
                  title="删除"
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div
              id="luckysheet-modal-dialog-cropping"
              className="luckysheet-modal-dialog"
              style={{
                display: "none",
                padding: 0,
                position: "absolute",
                zIndex: 300,
              }}
            >
              <div className="cropping-mask" />
              <div className="cropping-content" />
              <div
                className="luckysheet-modal-dialog-border"
                style={{ position: "absolute" }}
              />
              <div className="luckysheet-modal-dialog-resize">
                <div className="resize-item lt" data-type="lt" />
                <div className="resize-item mt" data-type="mt" />
                <div className="resize-item lm" data-type="lm" />
                <div className="resize-item rm" data-type="rm" />
                <div className="resize-item rt" data-type="rt" />
                <div className="resize-item lb" data-type="lb" />
                <div className="resize-item mb" data-type="mb" />
                <div className="resize-item rb" data-type="rb" />
              </div>
              <div className="luckysheet-modal-dialog-controll">
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-crop"
                  role="button"
                  tabIndex={0}
                  aria-label="裁剪"
                  title="裁剪"
                >
                  <i className="fa fa-pencil" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-restore"
                  role="button"
                  tabIndex={0}
                  aria-label="恢复原图"
                  title="恢复原图"
                >
                  <i className="fa fa-window-maximize" aria-hidden="true" />
                </span>
                <span
                  className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
                  role="button"
                  tabIndex={0}
                  aria-label="删除"
                  title="删除"
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div className="img-list" />
            <div className="cell-date-picker">
              {/* <input
            id="cellDatePickerBtn"
            className="formulaInputFocus"
            readOnly
          /> */}
            </div>
          </div>
          <div id="luckysheet-dataVerification-dropdown-btn" />
          <div
            id="luckysheet-dataVerification-dropdown-List"
            className="luckysheet-mousedown-cancel"
          />
          <div
            id="luckysheet-dataVerification-showHintBox"
            className="luckysheet-mousedown-cancel"
          />
          <div className="luckysheet-cell-copy" />
          <div className="luckysheet-grdblkflowpush" />
          <div
            id="luckysheet-cell-flow_0"
            className="luckysheet-cell-flow luckysheetsheetchange"
          >
            <div className="luckysheet-cell-flow-clip">
              <div className="luckysheet-grdblkpush" />
              <div
                id="luckysheetcoltable_0"
                className="luckysheet-cell-flow-col"
              >
                <div
                  id="luckysheet-sheettable_0"
                  className="luckysheet-cell-sheettable"
                  style={{ height: context.rh_height, width: context.ch_width }}
                />
                <div
                  id="luckysheet-bottom-controll-row"
                  className="luckysheet-bottom-controll-row"
                  style={{ left: 0 }}
                >
                  <button
                    id="luckysheet-bottom-add-row"
                    className="btn btn-default"
                  >
                    添加
                  </button>
                  <input
                    id="luckysheet-bottom-add-row-input"
                    type="text"
                    className="luckysheet-datavisual-config-input luckysheet-mousedown-cancel"
                    placeholder="100"
                  />
                  <span style={{ fontSize: 14 }}>行</span>
                  <span style={{ fontSize: 14, color: "#9c9c9c" }}>
                    (在底部添加)
                  </span>
                  <button
                    id="luckysheet-bottom-bottom-top"
                    className="btn btn-default"
                  >
                    回到顶部
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetOverlay;
