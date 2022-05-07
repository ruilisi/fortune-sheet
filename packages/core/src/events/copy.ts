import _ from "lodash";
import { cancelPaintModel } from "..";
import { Context } from "../context";
import { copy, selectIsOverlap } from "../modules/selection";
import { hasPartMC } from "../modules/validation";

export function handleCopy(ctx: Context) {
  // if (imageCtrl.currentImgId != null) {
  //   imageCtrl.copyImgItem(event);
  //   return;
  // }

  // // 复制时存在格式刷状态，取消格式刷
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
      // if (isEditMode()) {
      //   alert(locale_drag.noMerge);
      // } else {
      //   tooltip.info(locale_drag.noMerge, "");
      // }
      return;
    }
  }

  // 多重选区 有条件格式时 提示
  // const cdformat =
  //   ctx.luckysheetfile[getSheetIndex(ctx, ctx.currentSheetId)]
  //     .luckysheet_conditionformat_save;
  // if (
  //   ctx.luckysheet_select_save.length > 1 &&
  //   cdformat != null &&
  //   cdformat.length > 0
  // ) {
  //   let hasCF = false;

  //   const cf_compute = conditionformat.getComputeMap();

  //   label: for (let s = 0; s < ctx.luckysheet_select_save.length; s++) {
  //     if (hasCF) {
  //       break;
  //     }

  //     const r1 = ctx.luckysheet_select_save[s].row[0];
  //     const r2 = ctx.luckysheet_select_save[s].row[1];
  //     const c1 = ctx.luckysheet_select_save[s].column[0];
  //     const c2 = ctx.luckysheet_select_save[s].column[1];

  //     for (let r = r1; r <= r2; r++) {
  //       for (let c = c1; c <= c2; c++) {
  //         if (conditionformat.checksCF(r, c, cf_compute) != null) {
  //           hasCF = true;
  //           continue label;
  //         }
  //       }
  //     }
  //   }

  //   if (hasCF) {
  //     if (isEditMode()) {
  //       alert(locale_drag.noMulti);
  //     } else {
  //       tooltip.info(locale_drag.noMulti, "");
  //     }
  //     return;
  //   }
  // }

  // 多重选区 行不一样且列不一样时 提示
  if (selection.length > 1) {
    let isSameRow = true;
    const str_r = selection[0].row[0];
    const end_r = selection[0].row[1];
    let isSameCol = true;
    const str_c = selection[0].column[0];
    const end_c = selection[0].column[1];

    for (let s = 1; s < selection.length; s += 1) {
      if (selection[s].row[0] !== str_r || selection[s].row[1] !== end_r) {
        isSameRow = false;
      }
      if (
        selection[s].column[0] !== str_c ||
        selection[s].column[1] !== end_c
      ) {
        isSameCol = false;
      }
    }

    if ((!isSameRow && !isSameCol) || selectIsOverlap(ctx)) {
      // if (isEditMode()) {
      //   alert(locale_drag.noMulti);
      // } else {
      //   tooltip.info(locale_drag.noMulti, "");
      // }
      return;
    }
  }

  copy(ctx);

  ctx.luckysheet_paste_iscut = false;
}
