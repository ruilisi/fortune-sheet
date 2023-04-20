import _ from "lodash";
import { hideCRCount, removeActiveImage } from "..";
import { Context, getFlowdata } from "../context";
import { updateCell, cancelNormalSelected } from "../modules/cell";
import { handleFormulaInput } from "../modules/formula";
import {
  copy,
  deleteSelectedCellText,
  moveHighlightCell,
  moveHighlightRange,
  selectAll,
  selectionCache,
} from "../modules/selection";
import { cancelPaintModel, handleBold } from "../modules/toolbar";
import { hasPartMC } from "../modules/validation";
import { GlobalCache } from "../types";
import { getNowDateTime } from "../utils";
import { handleCopy } from "./copy";
import { jfrefreshgrid } from "../modules/refresh";
import { isAllowEdit } from "../api/common";

export function handleGlobalEnter(
  ctx: Context,
  cellInput: HTMLDivElement,
  e: KeyboardEvent,
  canvas?: CanvasRenderingContext2D
) {
  // const flowdata = getFlowdata(ctx);
  if ((e.altKey || e.metaKey) && ctx.luckysheetCellUpdate.length > 0) {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    if (last && !_.isNil(last.row_focus) && !_.isNil(last.column_focus)) {
      // const row_index = last.row_focus;
      // const col_index = last.column_focus;
      // enterKeyControll(flowdata?.[row_index]?.[col_index]);
    }
    e.preventDefault();
  } else if (ctx.luckysheetCellUpdate.length > 0) {
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
    const lastCellUpdate = _.clone(ctx.luckysheetCellUpdate);
    updateCell(
      ctx,
      ctx.luckysheetCellUpdate[0],
      ctx.luckysheetCellUpdate[1],
      cellInput,
      undefined,
      canvas
    );
    ctx.luckysheet_select_save = [
      {
        row: [lastCellUpdate[0], lastCellUpdate[0]],
        column: [lastCellUpdate[1], lastCellUpdate[1]],
        row_focus: lastCellUpdate[0],
        column_focus: lastCellUpdate[1],
      },
    ];
    moveHighlightCell(ctx, "down", 1, "rangeOfSelect");
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
  } else {
    // if (
    //   $(event.target).hasClass("formulaInputFocus") ||
    //   $("#luckysheet-conditionformat-dialog").is(":visible")
    // ) {
    //   return;
    // }
    if ((ctx.luckysheet_select_save?.length ?? 0) > 0) {
      const last =
        ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1];

      const row_index = last.row_focus;
      const col_index = last.column_focus;

      ctx.luckysheetCellUpdate = [row_index, col_index];
      // luckysheetupdateCell(row_index, col_index, ctx.flowdata);
      e.preventDefault();
    }
  }
}

function handleBatchSelectionWithArrowKey(ctx: Context, e: KeyboardEvent) {
  if (
    ctx.luckysheetCellUpdate.length > 0
    // || $("#luckysheet-singleRange-dialog").is(":visible") ||
    // $("#luckysheet-multiRange-dialog").is(":visible")
  ) {
    return;
  }
  switch (e.key) {
    /*
    case "ArrowUp":
      luckysheetMoveHighlightRange2("up", "rangeOfSelect");
      break;
    case "ArrowDown":
      luckysheetMoveHighlightRange2("down", "rangeOfSelect");
      break;
    case "ArrowLeft":
      luckysheetMoveHighlightRange2("left", "rangeOfSelect");
      break;
    case "ArrowRight":
      luckysheetMoveHighlightRange2("right", "rangeOfSelect");
      break;
  */
    default:
      break;
  }
}

export function handleWithCtrlOrMetaKey(
  ctx: Context,
  cache: GlobalCache,
  e: KeyboardEvent,
  cellInput: HTMLDivElement,
  fxInput: HTMLDivElement | null | undefined,
  handleUndo: () => void,
  handleRedo: () => void
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  if (e.shiftKey) {
    ctx.luckysheet_shiftpositon = _.cloneDeep(
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]
    );
    ctx.luckysheet_shiftkeydown = true;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      // Ctrl + Shift + 方向键  调整选区
      handleBatchSelectionWithArrowKey(ctx, e);
    } else if (_.includes([";", '"', ":", "'"], e.key)) {
      const last =
        ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
      if (!last) return;

      const row_index = last.row_focus!;
      const col_index = last.column_focus!;
      updateCell(ctx, row_index, col_index, cellInput);
      ctx.luckysheetCellUpdate = [row_index, col_index];

      cache.ignoreWriteCell = true;
      const value = getNowDateTime(2);
      cellInput.innerText = value;
      // $("#luckysheet-rich-text-editor").html(value);
      // luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
      handleFormulaInput(ctx, fxInput, cellInput, e.keyCode);
    } else if (e.key === "z") {
      // Ctrl + shift + z 重做
      setTimeout(handleRedo);
      e.stopPropagation();
      return;
    }
  } else if (e.key === "b") {
    // Ctrl + B  加粗
    handleBold(ctx, cellInput);
    // $("#luckysheet-icon-bold").click();
  } else if (e.key === "c") {
    // Ctrl + C  复制
    handleCopy(ctx);
    // luckysheetactiveCell();
    e.stopPropagation();
    return;
  } else if (e.key === "f") {
    // Ctrl + F  查找
    ctx.showSearchReplace = true;

    // } else if (e.key === "h") {
    //   // Ctrl + H  替换
    //   searchReplace.createDialog(1);
    //   searchReplace.init();

    //   $("#luckysheet-search-replace #searchInput input").focus();
    // } else if (e.key === "i") {
    //   // Ctrl + I  斜体
    //   $("#luckysheet-icon-italic").click();
  } else if (e.key === "v") {
    // Ctrl + V  粘贴
    // if (isEditMode()) {
    //   // 此模式下禁用粘贴
    //   return;
    // }

    // if ($(event.target).hasClass("formulaInputFocus")) {
    //   return;
    // }

    if ((ctx.luckysheet_select_save?.length ?? 0) > 1) {
      // if (isEditMode()) {
      //   alert(locale_drag.noPaste);
      // } else {
      //   tooltip.info(locale_drag.noPaste, "");
      // }
      return;
    }

    selectionCache.isPasteAction = true;
    // luckysheetactiveCell();
    e.stopPropagation();
    return;
  } else if (e.key === "x") {
    // Ctrl + X  剪切
    // 复制时存在格式刷状态，取消格式刷
    if (ctx.luckysheetPaintModelOn) {
      cancelPaintModel(ctx);
    }

    const selection = ctx.luckysheet_select_save;
    if (!selection || _.isEmpty(selection)) {
      return;
    }

    // 复制范围内包含部分合并单元格，提示
    if (ctx.config.merge != null) {
      let has_PartMC = false;

      for (let s = 0; s < selection.length; s += 1) {
        const r1 = selection[s].row[0];
        const r2 = selection[s].row[1];
        const c1 = selection[s].column[0];
        const c2 = selection[s].column[1];

        has_PartMC = hasPartMC(ctx, ctx.config, r1, r2, c1, c2);

        if (has_PartMC) {
          break;
        }
      }

      if (has_PartMC) {
        // if (luckysheetConfigsetting.editMode) {
        //   alert(_locale_drag.noMerge);
        // } else {
        //   tooltip.info(_locale_drag.noMerge, "");
        // }
        return;
      }
    }

    // 多重选区时 提示
    if (selection.length > 1) {
      // if (isEditMode()) {
      //   alert(locale_drag.noMulti);
      // } else {
      //   tooltip.info(locale_drag.noMulti, "");
      // }
      return;
    }

    copy(ctx);

    ctx.luckysheet_paste_iscut = true;
    // luckysheetactiveCell();

    e.stopPropagation();
    return;
  } else if (e.key === "z") {
    // Ctrl + Z  撤销
    setTimeout(handleUndo);
    e.stopPropagation();
    return;
  } /* else if (e.key === "ArrowUp") {
    // Ctrl + up  调整单元格
    if (
      parseInt($inputbox.css("top")) > 0 ||
      $("#luckysheet-singleRange-dialog").is(":visible") ||
      $("#luckysheet-multiRange-dialog").is(":visible")
    ) {
      return;
    }

    luckysheetMoveHighlightCell2("up", "rangeOfSelect");
  } else if (e.key === "ArrowDown") {
    // Ctrl + down  调整单元格
    if (
      parseInt($inputbox.css("top")) > 0 ||
      $("#luckysheet-singleRange-dialog").is(":visible") ||
      $("#luckysheet-multiRange-dialog").is(":visible")
    ) {
      return;
    }

    luckysheetMoveHighlightCell2("down", "rangeOfSelect");
  } else if (e.key === "ArrowLeft") {
    // Ctrl + top  调整单元格
    if (
      parseInt($inputbox.css("top")) > 0 ||
      $("#luckysheet-singleRange-dialog").is(":visible") ||
      $("#luckysheet-multiRange-dialog").is(":visible")
    ) {
      return;
    }

    luckysheetMoveHighlightCell2("left", "rangeOfSelect");
  } else if (e.key === "ArrowRight") {
    // Ctrl + right  调整单元格
    if (
      parseInt($inputbox.css("top")) > 0 ||
      $("#luckysheet-singleRange-dialog").is(":visible") ||
      $("#luckysheet-multiRange-dialog").is(":visible")
    ) {
      return;
    }

    luckysheetMoveHighlightCell2("right", "rangeOfSelect");
  } else if (e.keyCode === 186) {
    // Ctrl + ; 填充系统日期
    const last =
      ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
    const row_index = last.row_focus;
    const col_index = last.column_focus;
    luckysheetupdateCell(row_index, col_index, ctx.flowdata, true);

    const value = getNowDateTime(1);
    $("#luckysheet-rich-text-editor").html(value);
    luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
    formula.functionInputHanddler(
      $("#luckysheet-functionbox-cell"),
      $("#luckysheet-rich-text-editor"),
      e.keyCode
    );
  } else if (e.keyCode === 222) {
    // Ctrl + ' 填充系统时间
    const last =
      ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
    const row_index = last.row_focus;
    const col_index = last.column_focus;
    luckysheetupdateCell(row_index, col_index, ctx.flowdata, true);

    const value = getNowDateTime(2);
    $("#luckysheet-rich-text-editor").html(value);
    luckysheetRangeLast($("#luckysheet-rich-text-editor")[0]);
    formula.functionInputHanddler(
      $("#luckysheet-functionbox-cell"),
      $("#luckysheet-rich-text-editor"),
      e.keyCode
    );
  } */ else if (e.key === "a") {
    // Ctrl + A  全选
    // $("#luckysheet-left-top").trigger("mousedown");
    // $(document).trigger("mouseup");
    selectAll(ctx);
  }

  e.preventDefault();
}

function handleShiftWithArrowKey(ctx: Context, e: KeyboardEvent) {
  if (
    ctx.luckysheetCellUpdate.length > 0
    // || $(event.target).hasClass("formulaInputFocus")
  ) {
    return;
  }

  ctx.luckysheet_shiftpositon = _.cloneDeep(
    ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1]
  );
  ctx.luckysheet_shiftkeydown = true;
  /*
  if (
    $("#luckysheet-singleRange-dialog").is(":visible") ||
    $("#luckysheet-multiRange-dialog").is(":visible")
  ) {
    return;
  }
  */

  // shift + 方向键 调整选区
  switch (e.key) {
    case "ArrowUp":
      moveHighlightRange(ctx, "down", -1, "rangeOfSelect");
      break;
    case "ArrowDown":
      moveHighlightRange(ctx, "down", 1, "rangeOfSelect");
      break;
    case "ArrowLeft":
      moveHighlightRange(ctx, "right", -1, "rangeOfSelect");
      break;
    case "ArrowRight":
      moveHighlightRange(ctx, "right", 1, "rangeOfSelect");
      break;
    default:
      break;
  }

  e.preventDefault();
}

export function handleArrowKey(ctx: Context, e: KeyboardEvent) {
  if (
    ctx.luckysheetCellUpdate.length > 0 ||
    ctx.luckysheet_cell_selected_move ||
    ctx.luckysheet_cell_selected_extend
    // || $(event.target).hasClass("formulaInputFocus") ||
    // $("#luckysheet-singleRange-dialog").is(":visible") ||
    // $("#luckysheet-multiRange-dialog").is(":visible")
  ) {
    return;
  }

  const moveCount = hideCRCount(ctx, e.key);
  switch (e.key) {
    case "ArrowUp":
      moveHighlightCell(ctx, "down", -moveCount, "rangeOfSelect");
      break;
    case "ArrowDown":
      moveHighlightCell(ctx, "down", moveCount, "rangeOfSelect");
      break;
    case "ArrowLeft":
      moveHighlightCell(ctx, "right", -moveCount, "rangeOfSelect");
      break;
    case "ArrowRight":
      moveHighlightCell(ctx, "right", moveCount, "rangeOfSelect");
      break;
    default:
      break;
  }
}

export function handleGlobalKeyDown(
  ctx: Context,
  cellInput: HTMLDivElement,
  fxInput: HTMLDivElement | null | undefined,
  e: KeyboardEvent,
  cache: GlobalCache,
  handleUndo: () => void,
  handleRedo: () => void,
  canvas?: CanvasRenderingContext2D
) {
  ctx.luckysheet_select_status = false;
  const kcode = e.keyCode;
  const kstr = e.key;
  if (!_.isEmpty(ctx.contextMenu) || ctx.filterContextMenu) {
    return;
  }

  if (kstr === "Escape" && !!ctx.luckysheet_selection_range) {
    ctx.luckysheet_selection_range = [];
  }

  const allowEdit = isAllowEdit(ctx);

  if (
    // $("#luckysheet-modal-dialog-mask").is(":visible") ||
    // $(event.target).hasClass("luckysheet-mousedown-cancel") ||
    // $(event.target).hasClass("sp-input") ||
    ctx.luckysheetCellUpdate.length > 0 &&
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

    //       ctx.luckysheet_select_save = [
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

    //       const row = ctx.visibledatarow[cellrange.row[1]];
    //       const row_pre =
    //         cellrange.row[0] - 1 === -1
    //           ? 0
    //           : ctx.visibledatarow[cellrange.row[0] - 1];
    //       const col = ctx.visibledatacolumn[cellrange.column[1]];
    //       const col_pre =
    //         cellrange.column[0] - 1 === -1
    //           ? 0
    //           : ctx.visibledatacolumn[cellrange.column[0] - 1];

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

  if (kstr === "Enter") {
    if (!allowEdit) return;
    handleGlobalEnter(ctx, cellInput, e, canvas);
  } else if (kstr === "Tab") {
    if (ctx.luckysheetCellUpdate.length > 0) {
      return;
    }

    moveHighlightCell(ctx, "right", 1, "rangeOfSelect");
    e.preventDefault();
  } else if (kstr === "F2") {
    if (!allowEdit) return;
    if (ctx.luckysheetCellUpdate.length > 0) {
      return;
    }

    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    if (!last) return;

    const row_index = last.row_focus;
    const col_index = last.column_focus;

    ctx.luckysheetCellUpdate = [row_index, col_index];
    e.preventDefault();
  } else if (kstr === "F4" && ctx.luckysheetCellUpdate.length > 0) {
    // TODO formula.setfreezonFuc(event);
    e.preventDefault();
  } else if (kstr === "Escape" && ctx.luckysheetCellUpdate.length > 0) {
    cancelNormalSelected(ctx);
    moveHighlightCell(ctx, "down", 0, "rangeOfSelect");
    e.preventDefault();
  } else {
    if (e.ctrlKey || e.metaKey) {
      handleWithCtrlOrMetaKey(
        ctx,
        cache,
        e,
        cellInput,
        fxInput,
        handleUndo,
        handleRedo
      );
      return;
    }
    if (
      e.shiftKey &&
      (kstr === "ArrowUp" ||
        kstr === "ArrowDown" ||
        kstr === "ArrowLeft" ||
        kstr === "ArrowRight")
    ) {
      handleShiftWithArrowKey(ctx, e);
    } else if (kstr === "Escape") {
      ctx.contextMenu = {};
      // if (menuButton.luckysheetPaintModelOn) {
      //   menuButton.cancelPaintModel();
      // } else {
      //   cleargridelement(event);
      //   e.preventDefault();
      // }

      // selectHightlightShow();
    } else if (kstr === "Delete" || kstr === "Backspace") {
      if (!allowEdit) return;
      if (ctx.activeImg != null) {
        removeActiveImage(ctx);
      } else {
        deleteSelectedCellText(ctx);
      }

      jfrefreshgrid(ctx, null, undefined);
      e.preventDefault();
      // } else if (kstr === "Backspace" && imageCtrl.currentImgId != null) {
      //   imageCtrl.removeImgItem();
      //   e.preventDefault();
    } else if (
      kstr === "ArrowUp" ||
      kstr === "ArrowDown" ||
      kstr === "ArrowLeft" ||
      kstr === "ArrowRight"
    ) {
      handleArrowKey(ctx, e);
    } else if (
      !(
        (kcode >= 112 && kcode <= 123) ||
        kcode <= 46 ||
        kcode === 144 ||
        kcode === 108 ||
        e.ctrlKey ||
        e.altKey ||
        (e.shiftKey &&
          (kcode === 37 || kcode === 38 || kcode === 39 || kcode === 40))
      ) ||
      kcode === 8 ||
      kcode === 32 ||
      kcode === 46 ||
      kcode === 0 ||
      (e.ctrlKey && kcode === 86)
    ) {
      if (!allowEdit) return;
      if (
        String.fromCharCode(kcode) != null &&
        !_.isEmpty(ctx.luckysheet_select_save) && // $("#luckysheet-cell-selected").is(":visible") &&
        kstr !== "CapsLock" &&
        kstr !== "Win" &&
        kcode !== 18
      ) {
        // 激活输入框，并将按键输入到输入框
        const last =
          ctx.luckysheet_select_save![ctx.luckysheet_select_save!.length - 1];

        const row_index = last.row_focus;
        const col_index = last.column_focus;

        ctx.luckysheetCellUpdate = [row_index, col_index];
        cache.overwriteCell = true;

        // if (kstr === "Backspace") {
        //   $("#luckysheet-rich-text-editor").html("<br/>");
        // }
        handleFormulaInput(ctx, fxInput, cellInput, kcode);
        // formula.functionInputHanddler(
        //   $("#luckysheet-functionbox-cell"),
        //   $("#luckysheet-rich-text-editor"),
        //   kcode
        // );
      }
    }
  }

  if (cellInput !== document.activeElement) {
    cellInput?.focus();
  }

  e.stopPropagation();
}
