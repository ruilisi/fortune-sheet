import { Patch } from "immer";
import _ from "lodash";
import { getSheetIndex } from ".";
import { Context } from "../context";
import { Op } from "../types";

export function filterPatch(patches: Patch[]) {
  return _.filter(patches, (p) => p.path[0] === "luckysheetfile");
}

export function patchToOp(ctx: Context, patches: Patch[]): Op[] {
  return patches.map((p) => {
    const op: Op = {
      op: p.op,
      value: p.value,
      path: p.path,
    };
    if (p.path[0] === "luckysheetfile" && _.isNumber(p.path[1])) {
      const index = ctx.luckysheetfile[p.path[1]].index!;
      op.index = index;
      op.path = p.path.slice(2);
    }
    return op;
  });
}

export function opToPatch(ctx: Context, ops: Op[]): Patch[] {
  return ops.map((op) => {
    const patch: Patch = {
      op: op.op,
      value: op.value,
      path: op.path,
    };
    if (op.index) {
      const i = getSheetIndex(ctx, op.index);
      if (i != null) {
        patch.path = ["luckysheetfile", i, ...op.path];
      } else {
        throw new Error(`sheet index: ${op.index} not found`);
      }
    }
    return patch;
  });
}
