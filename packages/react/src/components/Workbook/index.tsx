import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import "./index.css";
import defaultContext, {
  Context,
  getFlowdata,
  initSheetIndex,
} from "@fortune-sheet/core/src/context";
import produce from "immer";
import _, { assign } from "lodash";
import {
  CellWithRowAndCol,
  Sheet as SheetType,
} from "@fortune-sheet/core/src/types";
import { getSheetIndex } from "@fortune-sheet/core/src/utils";
import {
  cancelNormalSelected,
  updateCell,
} from "@fortune-sheet/core/src/modules/cell";
import { moveHighlightCell } from "@fortune-sheet/core/src/modules/selection";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";

const Workbook: React.FC<Settings> = (props) => {
  const [context, setContext] = useState(defaultContext());
  const cellInput = useRef<HTMLDivElement>();
  const mergedSettings = useMemo(() => assign(defaultSettings, props), [props]);
  const setContextValue = useCallback(
    <K extends keyof Context>(key: K, value: Context[K]) => {
      setContext(
        produce((draftCtx) => {
          draftCtx[key] = value;
        })
      );
    },
    []
  );
  const providerValue = useMemo(
    () => ({
      context,
      setContext,
      setContextValue,
      settings: mergedSettings,
      refs: {
        cellInput,
      },
    }),
    [context, mergedSettings, setContextValue]
  );
  useEffect(() => {
    setContext(
      produce((draftCtx) => {
        draftCtx.luckysheetfile = mergedSettings.data;
        initSheetIndex(draftCtx);
        const sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetIndex);
        const sheet = mergedSettings.data?.[sheetIdx];
        if (!sheet) return;
        const cellData = sheet.celldata;
        let { data } = sheet;
        // expand cell data
        if (_.isEmpty(data) && !_.isEmpty(cellData)) {
          const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
          const lastCol = _.maxBy(cellData, "c");
          if (lastRow && lastCol) {
            const expandedData: SheetType["data"] = _.times(lastRow.r + 1, () =>
              _.times(lastCol.c + 1, () => null)
            );
            cellData?.forEach((d) => {
              // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
              expandedData[d.r][d.c] = d.v;
            });
            draftCtx.luckysheetfile = produce(
              mergedSettings.data,
              (draftData) => {
                draftData[sheetIdx].data = expandedData;
              }
            );
            data = expandedData;
          }
        } else {
          draftCtx.luckysheetfile = mergedSettings.data;
        }

        draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
        if (draftCtx.luckysheet_select_save?.length === 0) {
          if (data?.[0]?.[0]?.mc) {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, data[0][0].mc.rs - 1],
                column: [0, data[0][0].mc.cs - 1],
              },
            ];
          } else {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, 0],
                column: [0, 0],
              },
            ];
          }
        }

        draftCtx.luckysheet_selection_range = _.isNil(
          sheet.luckysheet_selection_range
        )
          ? []
          : sheet.luckysheet_selection_range;
        draftCtx.config = _.isNil(sheet.config) ? {} : sheet.config;

        draftCtx.zoomRatio = _.isNil(sheet.zoomRatio) ? 1 : sheet.zoomRatio;

        if (!_.isNil(sheet.defaultRowHeight)) {
          draftCtx.defaultrowlen = parseFloat(sheet.defaultRowHeight);
        } else {
          draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
        }

        if (!_.isNil(sheet.defaultColWidth)) {
          draftCtx.defaultcollen = parseFloat(sheet.defaultColWidth);
        } else {
          draftCtx.defaultcollen = mergedSettings.defaultColWidth;
        }

        if (!_.isNil(sheet.showGridLines)) {
          const { showGridLines } = sheet;
          if (showGridLines === 0 || showGridLines === false) {
            draftCtx.showGridLines = false;
          } else {
            draftCtx.showGridLines = true;
          }
        } else {
          draftCtx.showGridLines = true;
        }
      })
    );
  }, [
    mergedSettings.data,
    context.currentSheetIndex,
    mergedSettings.defaultRowHeight,
    mergedSettings.defaultColWidth,
  ]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const { ctrlKey, altKey, shiftKey } = e;
    const kcode = e.keyCode;
    const kstr = e.key;
    setContext(
      produce((draftCtx) => {
        const flowdata = getFlowdata(draftCtx);
        if (
          // $("#luckysheet-modal-dialog-mask").is(":visible") ||
          // $(event.target).hasClass("luckysheet-mousedown-cancel") ||
          // $(event.target).hasClass("sp-input") ||
          draftCtx.luckysheetCellUpdate.length > 0 &&
          kstr !== "Enter" &&
          kstr !== "Tab" &&
          kstr !== "ArrowUp" &&
          kstr !== "ArrowDown" &&
          kstr !== "ArrowLeft" &&
          kstr !== "ArrowRight"
        ) {
          // const anchor = $(window.getSelection().anchorNode);

          // if (
          //   anchor.parent().is("#luckysheet-helpbox-cell") ||
          //   anchor.is("#luckysheet-helpbox-cell")
          // ) {
          //   if (kcode === keycode.ENTER) {
          //     const helpboxValue = $("#luckysheet-helpbox-cell").text();

          //     if (formula.iscelldata(helpboxValue)) {
          //       const cellrange = formula.getcellrange(helpboxValue);

          //       draftCtx.luckysheet_select_save = [
          //         {
          //           row: cellrange.row,
          //           column: cellrange.column,
          //           row_focus: cellrange.row[0],
          //           column_focus: cellrange.column[0],
          //         },
          //       ];
          //       selectHightlightShow();

          //       $("#luckysheet-helpbox-cell").blur();

          //       const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
          //       const scrollTop = $("#luckysheet-cell-main").scrollTop();
          //       const winH = $("#luckysheet-cell-main").height();
          //       const winW = $("#luckysheet-cell-main").width();

          //       const row = draftCtx.visibledatarow[cellrange.row[1]];
          //       const row_pre =
          //         cellrange.row[0] - 1 === -1
          //           ? 0
          //           : draftCtx.visibledatarow[cellrange.row[0] - 1];
          //       const col = draftCtx.visibledatacolumn[cellrange.column[1]];
          //       const col_pre =
          //         cellrange.column[0] - 1 === -1
          //           ? 0
          //           : draftCtx.visibledatacolumn[cellrange.column[0] - 1];

          //       if (col - scrollLeft - winW + 20 > 0) {
          //         $("#luckysheet-scrollbar-x").scrollLeft(col - winW + 20);
          //       } else if (col_pre - scrollLeft - 20 < 0) {
          //         $("#luckysheet-scrollbar-x").scrollLeft(col_pre - 20);
          //       }

          //       if (row - scrollTop - winH + 20 > 0) {
          //         $("#luckysheet-scrollbar-y").scrollTop(row - winH + 20);
          //       } else if (row_pre - scrollTop - 20 < 0) {
          //         $("#luckysheet-scrollbar-y").scrollTop(row_pre - 20);
          //       }
          //     }
          //   }
          // }

          return;
        }

        // if (
        //   $("#luckysheet-modal-dialog-mask").is(":visible") ||
        //   $(event.target).hasClass("luckysheet-mousedown-cancel") ||
        //   $(event.target).hasClass("formulaInputFocus")
        // ) {
        //   return;
        // }

        if (
          (altKey || e.metaKey) &&
          kstr === "Enter" &&
          draftCtx.luckysheetCellUpdate.length > 0
        ) {
          const last =
            draftCtx.luckysheet_select_save[
              draftCtx.luckysheet_select_save.length - 1
            ];
          const row_index = last.row_focus;
          const col_index = last.column_focus;
          enterKeyControll(flowdata?.[row_index]?.[col_index]);
          e.preventDefault();
        } else if (
          kstr === "Enter" &&
          draftCtx.luckysheetCellUpdate.length > 0
        ) {
          // if (
          //   $("#luckysheet-formula-search-c").is(":visible") &&
          //   formula.searchFunctionCell != null
          // ) {
          //   formula.searchFunctionEnter(
          //     $("#luckysheet-formula-search-c").find(
          //       ".luckysheet-formula-search-item-active"
          //     )
          //   );
          // } else {
          updateCell(
            draftCtx,
            draftCtx.luckysheetCellUpdate[0],
            draftCtx.luckysheetCellUpdate[1],
            providerValue.refs.cellInput.current!
          );
          draftCtx.luckysheet_select_save = [
            {
              row: [
                draftCtx.luckysheetCellUpdate[0],
                draftCtx.luckysheetCellUpdate[0],
              ],
              column: [
                draftCtx.luckysheetCellUpdate[1],
                draftCtx.luckysheetCellUpdate[1],
              ],
              row_focus: draftCtx.luckysheetCellUpdate[0],
              column_focus: draftCtx.luckysheetCellUpdate[1],
            },
          ];
          moveHighlightCell(draftCtx, "down", 1, "rangeOfSelect");
          // }

          // // 若有参数弹出框，隐藏
          // if ($("#luckysheet-search-formula-parm").is(":visible")) {
          //   $("#luckysheet-search-formula-parm").hide();
          // }
          // // 若有参数选取范围弹出框，隐藏
          // if ($("#luckysheet-search-formula-parm-select").is(":visible")) {
          //   $("#luckysheet-search-formula-parm-select").hide();
          // }
          e.preventDefault();
        } else if (kstr === "Tab") {
          if (draftCtx.luckysheetCellUpdate.length > 0) {
            return;
          }

          moveHighlightCell(draftCtx, "right", 1, "rangeOfSelect");
          e.preventDefault();
        } else if (kstr === "F2") {
          if (draftCtx.luckysheetCellUpdate.length > 0) {
            return;
          }

          const last =
            draftCtx.luckysheet_select_save[
              draftCtx.luckysheet_select_save.length - 1
            ];

          const row_index = last.row_focus;
          const col_index = last.column_focus;

          luckysheetupdateCell(row_index, col_index, flowdata);
          e.preventDefault();
        } else if (kstr === "F4" && draftCtx.luckysheetCellUpdate.length > 0) {
          formula.setfreezonFuc(event);
          e.preventDefault();
        } else if (
          kstr === "Escape" &&
          draftCtx.luckysheetCellUpdate.length > 0
        ) {
          cancelNormalSelected(draftCtx);
          moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
          e.preventDefault();
        } else if (kstr === "Enter") {
          if (
            $(event.target).hasClass("formulaInputFocus") ||
            $("#luckysheet-conditionformat-dialog").is(":visible")
          ) {
            return;
          }
          if (
            String.fromCharCode(kcode) != null &&
            $("#luckysheet-cell-selected").is(":visible")
          ) {
            const last =
              draftCtx.luckysheet_select_save[
                draftCtx.luckysheet_select_save.length - 1
              ];

            const row_index = last.row_focus;
            const col_index = last.column_focus;

            luckysheetupdateCell(row_index, col_index, draftCtx.flowdata);
            e.preventDefault();
          }
        } else {
          if (ctrlKey || e.metaKey) {
            if (shiftKey) {
              if (!luckysheet_shiftkeydown) {
                draftCtx.luckysheet_shiftpositon = $.extend(
                  true,
                  {},
                  draftCtx.luckysheet_select_save[
                    draftCtx.luckysheet_select_save.length - 1
                  ]
                );
                draftCtx.luckysheet_shiftkeydown = true;
              }

              // Ctrl + shift + 方向键  调整选区
              if (kstr === "ArrowUp") {
                if (
                  parseInt($inputbox.css("top")) > 0 ||
                  $("#luckysheet-singleRange-dialog").is(":visible") ||
                  $("#luckysheet-multiRange-dialog").is(":visible")
                ) {
                  return;
                }

                luckysheetMoveHighlightRange2("up", "rangeOfSelect");
              } else if (kstr === "ArrowDown") {
                if (
                  parseInt($inputbox.css("top")) > 0 ||
                  $("#luckysheet-singleRange-dialog").is(":visible") ||
                  $("#luckysheet-multiRange-dialog").is(":visible")
                ) {
                  return;
                }

                luckysheetMoveHighlightRange2("down", "rangeOfSelect");
              } else if (kstr === "ArrowLeft") {
                if (
                  parseInt($inputbox.css("top")) > 0 ||
                  $("#luckysheet-singleRange-dialog").is(":visible") ||
                  $("#luckysheet-multiRange-dialog").is(":visible")
                ) {
                  return;
                }

                luckysheetMoveHighlightRange2("left", "rangeOfSelect");
              } else if (kstr === "ArrowRight") {
                if (
                  parseInt($inputbox.css("top")) > 0 ||
                  $("#luckysheet-singleRange-dialog").is(":visible") ||
                  $("#luckysheet-multiRange-dialog").is(":visible")
                ) {
                  return;
                }

                luckysheetMoveHighlightRange2("right", "rangeOfSelect");
              } else if (kcode === 186 || kcode === 222) {
                const last =
                  draftCtx.luckysheet_select_save[
                    draftCtx.luckysheet_select_save.length - 1
                  ];
                const row_index = last.row_focus;
                const col_index = last.column_focus;
                luckysheetupdateCell(
                  row_index,
                  col_index,
                  draftCtx.flowdata,
                  true
                );

                const value = getNowDateTime(2);
                $("#luckysheet-rich-text-editor").html(value);
                luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
                formula.functionInputHanddler(
                  $("#luckysheet-functionbox-cell"),
                  $("#luckysheet-rich-text-editor"),
                  kcode
                );
              }
            } else if (kcode === 66) {
              // Ctrl + B  加粗
              $("#luckysheet-icon-bold").click();
            } else if (kcode === 67) {
              // Ctrl + C  复制
              if (imageCtrl.currentImgId != null) {
                imageCtrl.copyImgItem(event);
                return;
              }

              // 复制时存在格式刷状态，取消格式刷
              if (menuButton.luckysheetPaintModelOn) {
                menuButton.cancelPaintModel();
              }

              if (draftCtx.luckysheet_select_save.length === 0) {
                return;
              }

              // 复制范围内包含部分合并单元格，提示
              if (draftCtx.config.merge != null) {
                let has_PartMC = false;

                for (
                  let s = 0;
                  s < draftCtx.luckysheet_select_save.length;
                  s++
                ) {
                  const r1 = draftCtx.luckysheet_select_save[s].row[0];
                  const r2 = draftCtx.luckysheet_select_save[s].row[1];
                  const c1 = draftCtx.luckysheet_select_save[s].column[0];
                  const c2 = draftCtx.luckysheet_select_save[s].column[1];

                  has_PartMC = hasPartMC(draftCtx.config, r1, r2, c1, c2);

                  if (has_PartMC) {
                    break;
                  }
                }

                if (has_PartMC) {
                  if (isEditMode()) {
                    alert(locale_drag.noMerge);
                  } else {
                    tooltip.info(locale_drag.noMerge, "");
                  }
                  return;
                }
              }

              // 多重选区 有条件格式时 提示
              const cdformat =
                draftCtx.luckysheetfile[
                  getSheetIndex(draftCtx.currentSheetIndex)
                ].luckysheet_conditionformat_save;
              if (
                draftCtx.luckysheet_select_save.length > 1 &&
                cdformat != null &&
                cdformat.length > 0
              ) {
                let hasCF = false;

                const cf_compute = conditionformat.getComputeMap();

                label: for (
                  let s = 0;
                  s < draftCtx.luckysheet_select_save.length;
                  s++
                ) {
                  if (hasCF) {
                    break;
                  }

                  const r1 = draftCtx.luckysheet_select_save[s].row[0];
                  const r2 = draftCtx.luckysheet_select_save[s].row[1];
                  const c1 = draftCtx.luckysheet_select_save[s].column[0];
                  const c2 = draftCtx.luckysheet_select_save[s].column[1];

                  for (let r = r1; r <= r2; r++) {
                    for (let c = c1; c <= c2; c++) {
                      if (conditionformat.checksCF(r, c, cf_compute) != null) {
                        hasCF = true;
                        continue label;
                      }
                    }
                  }
                }

                if (hasCF) {
                  if (isEditMode()) {
                    alert(locale_drag.noMulti);
                  } else {
                    tooltip.info(locale_drag.noMulti, "");
                  }
                  return;
                }
              }

              // 多重选区 行不一样且列不一样时 提示
              if (draftCtx.luckysheet_select_save.length > 1) {
                let isSameRow = true;
                const str_r = draftCtx.luckysheet_select_save[0].row[0];
                const end_r = draftCtx.luckysheet_select_save[0].row[1];
                let isSameCol = true;
                const str_c = draftCtx.luckysheet_select_save[0].column[0];
                const end_c = draftCtx.luckysheet_select_save[0].column[1];

                for (
                  let s = 1;
                  s < draftCtx.luckysheet_select_save.length;
                  s++
                ) {
                  if (
                    draftCtx.luckysheet_select_save[s].row[0] != str_r ||
                    draftCtx.luckysheet_select_save[s].row[1] != end_r
                  ) {
                    isSameRow = false;
                  }
                  if (
                    draftCtx.luckysheet_select_save[s].column[0] != str_c ||
                    draftCtx.luckysheet_select_save[s].column[1] != end_c
                  ) {
                    isSameCol = false;
                  }
                }

                if ((!isSameRow && !isSameCol) || selectIsOverlap()) {
                  if (isEditMode()) {
                    alert(locale_drag.noMulti);
                  } else {
                    tooltip.info(locale_drag.noMulti, "");
                  }
                  return;
                }
              }

              selection.copy(event);

              draftCtx.luckysheet_paste_iscut = false;
              luckysheetactiveCell();

              event.stopPropagation();
              return;
            } else if (kcode === 70) {
              // Ctrl + F  查找
              searchReplace.createDialog(0);
              searchReplace.init();

              $("#luckysheet-search-replace #searchInput input").focus();
            } else if (kcode === 72) {
              // Ctrl + H  替换
              searchReplace.createDialog(1);
              searchReplace.init();

              $("#luckysheet-search-replace #searchInput input").focus();
            } else if (kcode === 73) {
              // Ctrl + I  斜体
              $("#luckysheet-icon-italic").click();
            } else if (kcode === 86) {
              // Ctrl + V  粘贴
              if (isEditMode()) {
                // 此模式下禁用粘贴
                return;
              }

              if ($(event.target).hasClass("formulaInputFocus")) {
                return;
              }

              if (draftCtx.luckysheet_select_save.length > 1) {
                if (isEditMode()) {
                  alert(locale_drag.noPaste);
                } else {
                  tooltip.info(locale_drag.noPaste, "");
                }
                return;
              }

              selection.isPasteAction = true;
              luckysheetactiveCell();

              event.stopPropagation();
              return;
            } else if (kcode === 88) {
              // Ctrl + X  剪切
              // 复制时存在格式刷状态，取消格式刷
              if (menuButton.luckysheetPaintModelOn) {
                menuButton.cancelPaintModel();
              }

              if (draftCtx.luckysheet_select_save.length === 0) {
                return;
              }

              // 复制范围内包含部分合并单元格，提示
              if (draftCtx.config.merge != null) {
                let has_PartMC = false;

                for (
                  let s = 0;
                  s < draftCtx.luckysheet_select_save.length;
                  s++
                ) {
                  const r1 = draftCtx.luckysheet_select_save[s].row[0];
                  const r2 = draftCtx.luckysheet_select_save[s].row[1];
                  const c1 = draftCtx.luckysheet_select_save[s].column[0];
                  const c2 = draftCtx.luckysheet_select_save[s].column[1];

                  has_PartMC = hasPartMC(draftCtx.config, r1, r2, c1, c2);

                  if (has_PartMC) {
                    break;
                  }
                }

                if (has_PartMC) {
                  if (luckysheetConfigsetting.editMode) {
                    alert(_locale_drag.noMerge);
                  } else {
                    tooltip.info(_locale_drag.noMerge, "");
                  }
                  return;
                }
              }

              // 多重选区时 提示
              if (draftCtx.luckysheet_select_save.length > 1) {
                if (isEditMode()) {
                  alert(locale_drag.noMulti);
                } else {
                  tooltip.info(locale_drag.noMulti, "");
                }
                return;
              }

              selection.copy(event);

              draftCtx.luckysheet_paste_iscut = true;
              luckysheetactiveCell();

              event.stopPropagation();
              return;
            } else if (kcode === 90) {
              // Ctrl + Z  撤销
              controlHistory.redo(event);
              luckysheetactiveCell();
              event.stopPropagation();
              return;
            } else if (kcode === 89) {
              // Ctrl + Y  重做
              controlHistory.undo(event);
              luckysheetactiveCell();
              event.stopPropagation();
              return;
            } else if (kcode === keycode.UP) {
              // Ctrl + up  调整单元格
              if (
                parseInt($inputbox.css("top")) > 0 ||
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightCell2("up", "rangeOfSelect");
            } else if (kcode === keycode.DOWN) {
              // Ctrl + down  调整单元格
              if (
                parseInt($inputbox.css("top")) > 0 ||
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightCell2("down", "rangeOfSelect");
            } else if (kcode === keycode.LEFT) {
              // Ctrl + top  调整单元格
              if (
                parseInt($inputbox.css("top")) > 0 ||
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightCell2("left", "rangeOfSelect");
            } else if (kcode === keycode.RIGHT) {
              // Ctrl + right  调整单元格
              if (
                parseInt($inputbox.css("top")) > 0 ||
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightCell2("right", "rangeOfSelect");
            } else if (kcode === 186) {
              // Ctrl + ; 填充系统日期
              const last =
                draftCtx.luckysheet_select_save[
                  draftCtx.luckysheet_select_save.length - 1
                ];
              const row_index = last.row_focus;
              const col_index = last.column_focus;
              luckysheetupdateCell(
                row_index,
                col_index,
                draftCtx.flowdata,
                true
              );

              const value = getNowDateTime(1);
              $("#luckysheet-rich-text-editor").html(value);
              luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
              formula.functionInputHanddler(
                $("#luckysheet-functionbox-cell"),
                $("#luckysheet-rich-text-editor"),
                kcode
              );
            } else if (kcode === 222) {
              // Ctrl + ' 填充系统时间
              const last =
                draftCtx.luckysheet_select_save[
                  draftCtx.luckysheet_select_save.length - 1
                ];
              const row_index = last.row_focus;
              const col_index = last.column_focus;
              luckysheetupdateCell(
                row_index,
                col_index,
                draftCtx.flowdata,
                true
              );

              const value = getNowDateTime(2);
              $("#luckysheet-rich-text-editor").html(value);
              luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
              formula.functionInputHanddler(
                $("#luckysheet-functionbox-cell"),
                $("#luckysheet-rich-text-editor"),
                kcode
              );
            } else if (String.fromCharCode(kcode).toLocaleUpperCase() === "A") {
              // Ctrl + A  全选
              // $("#luckysheet-left-top").trigger("mousedown");
              // $(document).trigger("mouseup");
              $("#luckysheet-left-top").click();
            }

            e.preventDefault();
            return;
          }
          if (
            shiftKey &&
            (kstr === "ArrowUp" ||
              kstr === "ArrowDown" ||
              kstr === "ArrowLeft" ||
              kstr === "ArrowRight" ||
              (altKey && (kcode === 53 || kcode === 101)))
          ) {
            if (
              draftCtx.luckysheetCellUpdate.length > 0 ||
              $(event.target).hasClass("formulaInputFocus")
            ) {
              return;
            }

            if (!luckysheet_shiftkeydown) {
              draftCtx.luckysheet_shiftpositon = $.extend(
                true,
                {},
                draftCtx.luckysheet_select_save[
                  draftCtx.luckysheet_select_save.length - 1
                ]
              );
              draftCtx.luckysheet_shiftkeydown = true;
            }

            // shift + 方向键 调整选区
            if (kcode === keycode.UP) {
              if (
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightRange("down", -1, "rangeOfSelect");
            } else if (kcode === keycode.DOWN) {
              if (
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightRange("down", 1, "rangeOfSelect");
            } else if (kcode === keycode.LEFT) {
              if (
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightRange("right", -1, "rangeOfSelect");
            } else if (kcode === keycode.RIGHT) {
              if (
                $("#luckysheet-singleRange-dialog").is(":visible") ||
                $("#luckysheet-multiRange-dialog").is(":visible")
              ) {
                return;
              }

              luckysheetMoveHighlightRange("right", 1, "rangeOfSelect");
            } else if (altKey && (kcode === 53 || kcode === 101)) {
              // Alt + Shift + 5（删除线）
              $("#luckysheet-icon-strikethrough").click();
            }
            // else if (altKey && (kcode === 54 || kcode === 102)) {
            //     //Alt + Shift + 6（删除线）
            //     $("#luckysheet-icon-underline").click();
            // }

            e.preventDefault();
          } else if (kstr === "Escape") {
            if (menuButton.luckysheetPaintModelOn) {
              menuButton.cancelPaintModel();
            } else {
              cleargridelement(event);
              e.preventDefault();
            }

            selectHightlightShow();
          } else if (kstr === "Delete" || kstr === "Backspace") {
            if (imageCtrl.currentImgId != null) {
              imageCtrl.removeImgItem();
            } else {
              $("#luckysheet-delete-text").click();
            }

            e.preventDefault();
          } else if (kcode === 8 && imageCtrl.currentImgId != null) {
            imageCtrl.removeImgItem();
            e.preventDefault();
          } else if (kstr === "ArrowUp") {
            if (
              parseInt($inputbox.css("top")) > 0 ||
              draftCtx.luckysheet_cell_selected_move ||
              draftCtx.luckysheet_cell_selected_extend ||
              $(event.target).hasClass("formulaInputFocus") ||
              $("#luckysheet-singleRange-dialog").is(":visible") ||
              $("#luckysheet-multiRange-dialog").is(":visible")
            ) {
              return;
            }

            moveHighlightCell(draftCtx, "down", -1, "rangeOfSelect");
            e.preventDefault();
          } else if (kstr === "ArrowDown") {
            if (
              parseInt($inputbox.css("top")) > 0 ||
              draftCtx.luckysheet_cell_selected_move ||
              draftCtx.luckysheet_cell_selected_extend ||
              $(event.target).hasClass("formulaInputFocus") ||
              $("#luckysheet-singleRange-dialog").is(":visible") ||
              $("#luckysheet-multiRange-dialog").is(":visible")
            ) {
              return;
            }

            moveHighlightCell(draftCtx, "down", 1, "rangeOfSelect");
            e.preventDefault();
          } else if (kstr === "ArrowLeft") {
            if (
              parseInt($inputbox.css("top")) > 0 ||
              draftCtx.luckysheet_cell_selected_move ||
              draftCtx.luckysheet_cell_selected_extend ||
              $(event.target).hasClass("formulaInputFocus") ||
              $("#luckysheet-singleRange-dialog").is(":visible") ||
              $("#luckysheet-multiRange-dialog").is(":visible")
            ) {
              return;
            }

            moveHighlightCell(draftCtx, "right", -1, "rangeOfSelect");
            e.preventDefault();
          } else if (kstr === "ArrowRight") {
            if (
              parseInt($inputbox.css("top")) > 0 ||
              draftCtx.luckysheet_cell_selected_move ||
              draftCtx.luckysheet_cell_selected_extend ||
              $(event.target).hasClass("formulaInputFocus") ||
              $("#luckysheet-singleRange-dialog").is(":visible") ||
              $("#luckysheet-multiRange-dialog").is(":visible")
            ) {
              return;
            }

            moveHighlightCell(draftCtx, "right", 1, "rangeOfSelect");
            e.preventDefault();
          } else if (
            !(
              (kcode >= 112 && kcode <= 123) ||
              kcode <= 46 ||
              kcode === 144 ||
              kcode === 108 ||
              ctrlKey ||
              altKey ||
              (shiftKey &&
                (kcode === 37 || kcode === 38 || kcode === 39 || kcode === 40))
            ) ||
            kcode === 8 ||
            kcode === 32 ||
            kcode === 46 ||
            kcode === 0 ||
            (event.ctrlKey && kcode === 86)
          ) {
            if (
              String.fromCharCode(kcode) != null &&
              draftCtx.luckysheet_select_save.length > 0 && // $("#luckysheet-cell-selected").is(":visible") &&
              kcode != "CapsLock" &&
              kcode != "Win" &&
              kcode != 18
            ) {
              const last =
                draftCtx.luckysheet_select_save[
                  draftCtx.luckysheet_select_save.length - 1
                ];

              const row_index = last.row_focus;
              const col_index = last.column_focus;

              luckysheetupdateCell(row_index, col_index, flowdata, true);
              if (kcode === 8) {
                $("#luckysheet-rich-text-editor").html("<br/>");
              }
              formula.functionInputHanddler(
                $("#luckysheet-functionbox-cell"),
                $("#luckysheet-rich-text-editor"),
                kcode
              );
            }
          }
        }

        providerValue.refs.cellInput.current?.focus();
      })
    );

    e.stopPropagation();
  }, []);

  if (!context.luckysheetfile) {
    return null;
  }

  const sheetData =
    context.luckysheetfile[getSheetIndex(context, context.currentSheetIndex)]
      ?.data;
  if (!sheetData) {
    return null;
  }

  return (
    <WorkbookContext.Provider value={providerValue}>
      <div className="fortune-container" onKeyDown={onKeyDown}>
        <div className="fortune-workarea">
          <Toolbar />
          <FxEditor />
        </div>
        <Sheet data={sheetData} />
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
