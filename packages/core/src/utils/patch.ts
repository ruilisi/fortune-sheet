import _ from "lodash";
import { Patch } from "immer";
import { getSheetIndex } from ".";
import { Context, getFlowdata } from "../context";
import { CellMatrix, Op, Sheet } from "../types";
import { dataToCelldata } from "../api";

export type ChangedSheet = {
  index?: number;
  id?: string;
  value?: Sheet;
  order?: number;
};

export type PatchOptions = {
  insertRowColOp?: {
    type: "row" | "column";
    index: number;
    count: number;
    direction: "lefttop" | "rightbottom";
    id: string;
  };
  deleteRowColOp?: {
    type: "row" | "column";
    start: number;
    end: number;
    id: string;
  };
  restoreDeletedCells?: boolean;
  addSheetOp?: boolean;
  deleteSheetOp?: {
    id: string;
  };
  addSheet?: ChangedSheet;
  deletedSheet?: ChangedSheet;
  id?: string;
};

const addtionalMergeOps = (ops: Op[], id: string) => {
  let merge_new = {} as Record<string, any>;
  ops.some((op) => {
    if (
      op.op === "replace" &&
      op.path[0] === "config" &&
      op.path[1] === "merge"
    ) {
      merge_new = op.value;
      return true;
    }
    return false;
  });

  const new_ops: Op[] = [];
  Object.entries(merge_new).forEach(([, v]) => {
    const { r, c, rs, cs } = v as {
      r: number;
      c: number;
      rs: number;
      cs: number;
    };
    const headerOp = {
      op: "replace",
      path: ["data", r, c, "mc"],
      id,
      value: v,
    } as Op;

    for (let i = r; i < r + rs; i += 1) {
      for (let j = c; j < c + cs; j += 1) {
        new_ops.push({
          op: "replace",
          path: ["data", i, j, "mc"],
          id,
          value: { r, c },
        } as Op);
      }
    }

    new_ops.push(headerOp);
  });
  return new_ops;
};

function additionalCellOps(
  ctx: Context,
  insertRowColOp: {
    id: string;
    index: number;
    direction: string;
    count: number;
    type: string;
  }
) {
  const { id, index, direction, count, type } = insertRowColOp;
  const d = getFlowdata(ctx, id);
  const startIndex = index + (direction === "rightbottom" ? 1 : 0);
  if (d == null) {
    return [];
  }
  const cellOps: Op[] = [];
  if (type === "row") {
    for (let i = 0; i < d[startIndex].length; i += 1) {
      const cell = d[startIndex][i];
      if (cell != null) {
        for (let j = 0; j < count; j += 1) {
          cellOps.push({
            op: "replace",
            id,
            path: ["data", startIndex + j, i],
            value: cell,
          });
        }
      }
    }
  } else {
    for (let i = 0; i < d.length; i += 1) {
      const cell = d[i][startIndex];
      if (cell != null) {
        for (let j = 0; j < count; j += 1) {
          cellOps.push({
            op: "replace",
            id,
            path: ["data", i, startIndex + j],
            value: cell,
          });
        }
      }
    }
  }
  return cellOps;
}

export function filterPatch(patches: Patch[]) {
  return _.filter(
    patches,
    (p) =>
      p.path[0] === "luckysheetfile" && p.path[2] !== "luckysheet_select_save"
  );
}

export function extractFormulaCellOps(ops: Op[]) {
  // ops are ensured to be cell data ops
  const formulaOps: Op[] = [];
  ops.forEach((op) => {
    if (op.op === "remove") return;
    if (op.path.length === 2 && Array.isArray(op.value)) {
      // entire row op
      for (let i = 0; i < op.value.length; i += 1) {
        if (op.value[i]?.f) {
          formulaOps.push({
            op: "replace",
            id: op.id,
            path: [...op.path, i],
            value: op.value[i],
          });
        }
      }
    } else if (op.path.length === 3 && op.value?.f) {
      formulaOps.push(op);
    } else if (op.path.length === 4 && op.path[3] === "f") {
      formulaOps.push(op);
    }
  });
  return formulaOps;
}

export function patchToOp(
  ctx: Context,
  patches: Patch[],
  options?: PatchOptions,
  undo: boolean = false
): Op[] {
  let ops = patches.map((p) => {
    const op: Op = {
      op: p.op,
      value: p.value,
      path: p.path,
    };
    if (p.path[0] === "luckysheetfile" && _.isNumber(p.path[1])) {
      const id = ctx.luckysheetfile[p.path[1]].id!;
      op.id = id;
      op.path = p.path.slice(2);
      if (_.isEqual(op.path, ["calcChain", "length"])) {
        op.path = ["calcChain"];
        op.value = ctx.luckysheetfile[p.path[1]].calcChain;
      }
    }
    return op;
  });
  _.every(ops, (p) => {
    if (
      p.op === "replace" &&
      !_.isNil(p.value?.hl) &&
      p.path.length === 3 &&
      p.path![0] === "data"
    ) {
      const index = getSheetIndex(ctx, p.id!) as number;
      ops.push({
        id: p!.id!,
        op: "replace",
        path: ["hyperlink", `${p.path[1]}_${p.path![2]}`],
        value:
          ctx.luckysheetfile[index].hyperlink![
            `${p.value!.hl!.r!}_${p.value!.hl.c!}`
          ],
      });
    }
  });
  if (options?.insertRowColOp) {
    const [nonDataOps, dataOps] = _.partition(ops, (p) => p.path[0] !== "data");
    // find out formula cells as their formula range may be changed
    const formulaOps = extractFormulaCellOps(dataOps);
    ops = nonDataOps;
    ops.push({
      op: "insertRowCol",
      id: options.insertRowColOp.id,
      path: [],
      value: options.insertRowColOp,
    });
    ops = [...ops, ...formulaOps];

    const mergeOps = addtionalMergeOps(ops, ctx.currentSheetId);
    ops = [...ops, ...mergeOps];

    if (options?.restoreDeletedCells) {
      // undoing deleted row/col, find out cells to restore
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
                id: ctx.currentSheetId,
                value: cell,
              });
            }
          }
        }
      }
      ops = [...ops, ...restoreCellsOps];
    } else {
      const cellOps = additionalCellOps(ctx, options.insertRowColOp);
      ops = [...ops, ...cellOps];
    }
  } else if (options?.deleteRowColOp) {
    const [nonDataOps, dataOps] = _.partition(ops, (p) => p.path[0] !== "data");
    // find out formula cells as their formula range may be changed
    const formulaOps = extractFormulaCellOps(dataOps);
    ops = nonDataOps;
    ops.push({
      op: "deleteRowCol",
      id: options.deleteRowColOp.id,
      path: [],
      value: options.deleteRowColOp,
    });
    ops = [...ops, ...formulaOps];

    const mergeOps = addtionalMergeOps(ops, ctx.currentSheetId);
    ops = [...ops, ...mergeOps];
  } else if (options?.addSheetOp) {
    const [addSheetOps, otherOps] = _.partition(
      ops,
      (op) => op.path.length === 0 && op.op === "add"
    );
    options.id = options.addSheet!.id as string;
    if (undo) {
      // 撤消增表
      const index = getSheetIndex(
        ctx,
        options.addSheet!.id as string
      ) as number;
      const order = options.addSheet?.value?.order;
      ops = otherOps;
      ops.push({
        op: "deleteSheet",
        id: options.addSheet?.id,
        path: [],
        value: options.addSheet,
      });
      if (index !== ctx.luckysheetfile.length) {
        const sheetsRight = ctx.luckysheetfile.filter(
          (sheet) => (sheet?.order as number) >= (order as number)
        );
        _.forEach(sheetsRight, (sheet) => {
          ops.push({
            id: sheet.id,
            op: "replace",
            path: ["order"],
            value: (sheet?.order as number) - 1,
          });
        });
      }
    } else {
      // 正常增表
      ops = otherOps;
      ops.push({
        op: "addSheet",
        id: options.addSheet?.id,
        path: [],
        value: addSheetOps[0]?.value,
      });
    }
  } else if (options?.deleteSheetOp) {
    options.id = options.deleteSheetOp!.id as string;
    if (undo) {
      // 撤销删表
      ops = [
        {
          op: "addSheet",
          id: options.deleteSheetOp.id,
          path: [],
          value: options.deletedSheet?.value,
        },
        {
          id: options.deleteSheetOp.id,
          op: "replace",
          path: ["name"],
          value: options.deletedSheet?.value?.name,
        },
      ];
      const order = options.deletedSheet?.value?.order as number;
      const sheetsRight = ctx.luckysheetfile.filter(
        (sheet) =>
          (sheet?.order as number) >= (order as number) &&
          sheet.id !== options.deleteSheetOp?.id
      );
      _.forEach(sheetsRight, (sheet) => {
        ops.push({
          id: sheet.id,
          op: "replace",
          path: ["order"],
          value: sheet?.order as number,
        });
      });
    } else {
      // 正常删表
      ops = [
        {
          op: "deleteSheet",
          id: options.deleteSheetOp.id,
          path: [],
          value: options.deletedSheet,
        },
      ];
      const order = options.deletedSheet?.value?.order as number;
      if (options.deletedSheet?.order !== ctx.luckysheetfile.length) {
        const sheetsRight = ctx.luckysheetfile.filter(
          (sheet) => (sheet?.order as number) >= (order as number)
        );
        _.forEach(sheetsRight, (sheet) => {
          ops.push({
            id: sheet.id,
            op: "replace",
            path: ["order"],
            value: sheet?.order as number,
          });
        });
      }
    }
  }
  return ops;
}

function inverseRowColOptions(options: PatchOptions): PatchOptions | undefined {
  if (options.insertRowColOp) {
    let { index } = options.insertRowColOp;
    if (options.insertRowColOp.direction === "rightbottom") {
      index += 1;
    }
    return {
      deleteRowColOp: {
        type: options.insertRowColOp.type,
        id: options.insertRowColOp.id,
        start: index,
        end: index + options.insertRowColOp.count - 1,
      },
    };
  }
  if (options.deleteRowColOp) {
    return {
      insertRowColOp: {
        type: options.deleteRowColOp.type,
        id: options.deleteRowColOp.id,
        index: options.deleteRowColOp.start,
        count: options.deleteRowColOp.end - options.deleteRowColOp.start + 1,
        direction: "lefttop",
      },
      restoreDeletedCells: true,
    };
  }
  return {};
}

function inverseAddDelSheetOptions(
  ctx: Context,
  options: PatchOptions
): PatchOptions | undefined {
  const inversedOptions: PatchOptions = {};
  if (options.deleteSheetOp) {
    const index = getSheetIndex(ctx, options.deleteSheetOp.id) as number;
    inversedOptions.addSheetOp = true;
    inversedOptions.addSheet = {
      id: options.deleteSheetOp!.id as string,
      index: index as number,
      value: _.cloneDeep(ctx.luckysheetfile[index]),
    };
    inversedOptions!.addSheet!.value!.celldata = dataToCelldata(
      inversedOptions!.addSheet!.value?.data as CellMatrix
    );
    delete inversedOptions!.addSheet!.value!.data;
  }
  if (options.addSheetOp && options.addSheet) {
    const index = getSheetIndex(ctx, options.addSheet.id!) as number;
    inversedOptions.deletedSheet = {
      id: options.addSheet!.id as string,
      index: index as number,
    };
    inversedOptions.deleteSheetOp = { id: options.addSheet.id as string };
  }
  return inversedOptions;
}

export function opToPatch(ctx: Context, ops: Op[]): [Patch[], Op[]] {
  const [normalOps, specialOps] = _.partition(
    ops,
    (op) => op.op === "add" || op.op === "remove" || op.op === "replace"
  );
  const additionalPatches: Patch[] = [];
  const patches = normalOps.map((op) => {
    const patch: Patch = {
      op: op.op as "add" | "remove" | "replace",
      value: op.value,
      path: op.path,
    };
    if (op.id) {
      const i = getSheetIndex(ctx, op.id);
      if (i != null) {
        patch.path = ["luckysheetfile", i, ...op.path];
      } else {
        // throw new Error(`sheet id: ${op.id} not found`);
      }
      if (op.path[0] === "images" && op.id === ctx.currentSheetId) {
        additionalPatches.push({ ...patch, path: ["insertedImgs"] });
      }
    }
    return patch;
  });
  return [patches.concat(additionalPatches), specialOps];
}

export function getInverseOptions(ctx: Context, options?: PatchOptions) {
  if (!options) return options;
  if (options.insertRowColOp || options.deleteRowColOp) {
    return inverseRowColOptions(options);
  }
  if (options.addSheetOp || options.deleteSheetOp) {
    return inverseAddDelSheetOptions(ctx, options);
  }
  return options;
}
