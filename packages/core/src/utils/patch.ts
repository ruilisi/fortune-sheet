import _ from "lodash";
import { Patch } from "immer";
import { getSheetIndex } from ".";
import { Context, getFlowdata } from "../context";
import { Op } from "../types";

export type PatchOptions = {
  insertRowColOp?: {
    type: "row" | "column";
    index: number;
    count: number;
    direction: "lefttop" | "rightbottom";
    sheetIndex: string;
  };
  deleteRowColOp?: {
    type: "row" | "column";
    start: number;
    end: number;
    sheetIndex: string;
  };
  restoreDeletedCells?: boolean;
};

export function filterPatch(patches: Patch[]) {
  return _.filter(patches, (p) => p.path[0] === "luckysheetfile");
}

export function patchToOp(
  ctx: Context,
  patches: Patch[],
  options?: PatchOptions
): Op[] {
  let ops = patches.map((p) => {
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
  if (options?.insertRowColOp) {
    ops = ops.filter((p) => p.path[0] !== "data");
    ops.push({
      op: "insertRowCol",
      index: options.insertRowColOp.sheetIndex,
      path: [],
      value: options.insertRowColOp,
    });
    if (options?.restoreDeletedCells) {
      // find out cells to restore
      const restoreCellsOps: Op[] = [];
      const flowdata = getFlowdata(ctx);
      if (flowdata) {
        const rowlen = flowdata.length;
        const collen = flowdata[0].length;
        for (let i = 0; i < rowlen; i += 1) {
          for (let j = 0; j < collen; j += 1) {
            const cell = flowdata[i][j];
            if (!cell) continue;
            if (
              (options.insertRowColOp.type === "row" &&
                i >= options.insertRowColOp.index &&
                i <
                  options.insertRowColOp.index +
                    options.insertRowColOp.count) ||
              (options.insertRowColOp.type === "column" &&
                j >= options.insertRowColOp.index &&
                j < options.insertRowColOp.index + options.insertRowColOp.count)
            ) {
              restoreCellsOps.push({
                op: "replace",
                path: ["data", i, j],
                index: ctx.currentSheetIndex,
                value: cell,
              });
            }
          }
        }
      }
      ops = [...ops, ...restoreCellsOps];
    }
  } else if (options?.deleteRowColOp) {
    ops = ops.filter((p) => p.path[0] !== "data");
    ops.push({
      op: "deleteRowCol",
      index: options.deleteRowColOp.sheetIndex,
      path: [],
      value: options.deleteRowColOp,
    });
  }
  return ops;
}

export function opToPatch(ctx: Context, ops: Op[]): [Patch[], Op[]] {
  const [normalOps, rowcolOps] = _.partition(
    ops,
    (op) => op.op === "add" || op.op === "remove" || op.op === "replace"
  );
  const patches = normalOps.map((op) => {
    const patch: Patch = {
      op: op.op as "add" | "remove" | "replace",
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
  return [patches, rowcolOps];
}

export function inverseRowColOptions(
  options?: PatchOptions
): PatchOptions | undefined {
  if (!options) return options;
  if (options.insertRowColOp) {
    return {
      deleteRowColOp: {
        type: options.insertRowColOp.type,
        sheetIndex: options.insertRowColOp.sheetIndex,
        start: options.insertRowColOp.index,
        end: options.insertRowColOp.count,
      },
    };
  }
  if (options.deleteRowColOp) {
    return {
      insertRowColOp: {
        type: options.deleteRowColOp.type,
        sheetIndex: options.deleteRowColOp.sheetIndex,
        index: options.deleteRowColOp.start,
        count: options.deleteRowColOp.end - options.deleteRowColOp.start + 1,
        direction: "lefttop",
      },
    };
  }
  return options;
}
