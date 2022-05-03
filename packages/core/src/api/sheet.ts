import { Context } from "..";
import { getSheet } from "./common";

export function getAllSheets(ctx: Context) {
  return ctx.luckysheetfile;
}

export { getSheet };
