import { Patch } from "immer";
import _ from "lodash";

export function filterPatch(patch: Patch[]) {
  return _.filter(patch, (p) => p.path[0] === "luckysheetfile");
}
