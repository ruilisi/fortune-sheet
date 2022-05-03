import { Context } from "..";
import { Range } from "../types";
import { CommonOptions, getSheet } from "./common";
import { mergeCells as mergeCellsInternal } from "../modules";

export function mergeCells(
  ctx: Context,
  ranges: Range,
  type: string,
  options: CommonOptions = {}
) {
  const sheet = getSheet(ctx, options);
  mergeCellsInternal(ctx, sheet.index!, ranges, type);
}

export function cancelMerge(
  ctx: Context,
  ranges: Range,
  options: CommonOptions = {}
) {
  mergeCells(ctx, ranges, "merge-cancel", options);
}
