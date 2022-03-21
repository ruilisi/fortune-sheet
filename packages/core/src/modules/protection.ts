import _ from "lodash";
import { Context } from "../context";
import { getSheetByIndex } from "../utils";

export function checkProtectionSelectLockedOrUnLockedCells(
  ctx: Context,
  r: number,
  c: number,
  sheetIndex: string
) {
  //   const _locale = locale();
  //   const local_protection = _locale.protection;
  const sheetFile = getSheetByIndex(ctx, sheetIndex);
  if (sheetFile == null) {
    return true;
  }

  if (sheetFile.config == null || sheetFile.config.authority == null) {
    return true;
  }

  const aut = sheetFile.config.authority;

  if (_.isNil(aut) || _.isNil(aut.sheet) || aut.sheet === 0) {
    return true;
  }

  const { data } = sheetFile;
  const cell = data?.[r]?.[c];

  if (cell && cell.lo === 0) {
    // lo为0的时候才是可编辑
    if (aut.selectunLockedCells === 1 || _.isNil(aut.selectunLockedCells)) {
      return true;
    }
    return false;
  }
  // locked??
  const isAllEdit = false;
  // TODO  const isAllEdit = checkProtectionLockedSqref(
  //     r,
  //     c,
  //     aut,
  //     local_protection,
  //     false
  //   ); // dont alert password model
  if (isAllEdit) {
    // unlocked
    if (aut.selectunLockedCells === 1 || _.isNil(aut.selectunLockedCells)) {
      return true;
    }
    return false;
  }
  // locked
  if (aut.selectLockedCells === 1 || aut.selectLockedCells == null) {
    return true;
  }
  return false;
}
