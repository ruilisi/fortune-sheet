/* eslint-disable no-await-in-loop */
const _ = require("lodash");

/**
 * @param {import("mongodb").Collection} collection mongodb collection
 * @param {any[]} ops op list
 */
async function applyOp(collection, ops) {
  const operations = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const op of ops) {
    const { path, id } = op;
    const filter = { id };
    if (op.op === "insertRowCol") {
      /**
       * special op: insertRowCol
       */
      const field = op.value.type === "row" ? "r" : "c";
      let insertPos = op.value.index;
      if (op.value.direction === "rightbottom") {
        insertPos += 1;
      }
      operations.push({
        updateOne: {
          filter,
          update: {
            $inc: {
              [`celldata.$[e].${field}`]: op.value.count,
            },
          },
          arrayFilters: [{ [`e.${field}`]: { $gte: insertPos } }],
        },
      });
      await collection.bulkWrite(operations);
      operations.length = 0;
    } else if (op.op === "deleteRowCol") {
      /**
       * special op: deleteRowCol
       */
      const field = op.value.type === "row" ? "r" : "c";
      operations.push(
        // delete cells
        {
          updateOne: {
            filter,
            update: {
              $pull: {
                celldata: {
                  [field]: {
                    $gte: op.value.start,
                    $lte: op.value.end,
                  },
                },
              },
            },
          },
        },
        // decr indexes
        {
          updateOne: {
            filter,
            update: {
              $inc: {
                [`celldata.$[e].${field}`]: -(
                  op.value.end -
                  op.value.start +
                  1
                ),
              },
            },
            arrayFilters: [{ [`e.${field}`]: { $gte: op.value.start } }],
          },
        }
      );
      await collection.bulkWrite(operations);
      operations.length = 0;
    } else if (op.op === "addSheet") {
      /**
       * special op: addSheet
       */
      operations.push({ insertOne: { document: op.value } });
      await collection.bulkWrite(operations);
      operations.length = 0;
    } else if (op.op === "deleteSheet") {
      /**
       * special op: deleteSheet
       */
      operations.push({ deleteOne: { filter } });
      await collection.bulkWrite(operations);
      operations.length = 0;
    } else if (
      path.length >= 3 &&
      path[0] === "data" &&
      _.isNumber(path[1]) &&
      _.isNumber(path[2])
    ) {
      /**
       * cell update
       */
      const key = ["celldata.$[e].v", ...path.slice(3)].join(".");
      const [, r, c] = path;
      const options = { arrayFilters: [{ "e.r": r, "e.c": c }] };
      const updater =
        op.op === "remove"
          ? {
              $unset: {
                [key]: "",
              },
            }
          : {
              $set: {
                [key]: op.value,
              },
            };
      if (path.length === 3) {
        const cellExists = await collection.countDocuments(
          {
            ...filter,
            celldata: {
              $elemMatch: {
                r,
                c,
              },
            },
          },
          { limit: 1 }
        );
        if (cellExists) {
          operations.push({
            updateOne: { filter, update: updater, ...options },
          });
        } else {
          operations.push({
            updateOne: {
              filter,
              update: {
                $addToSet: {
                  celldata: {
                    r,
                    c,
                    v: op.value,
                  },
                },
              },
            },
          });
        }
      } else {
        operations.push({
          updateOne: { filter, update: updater, ...options },
        });
      }
    } else if (path.length === 2 && path[0] === "data" && _.isNumber(path[1])) {
      // entire row operation
      console.error("row assigning not supported");
    } else if (path.length === 0 && op.op === "add") {
      // add new sheet
      operations.push({ insertOne: { document: op.value } });
    } else if (path[0] !== "data") {
      // other config update
      if (op.op === "remove") {
        operations.push({
          updateOne: {
            filter,
            update: {
              $unset: {
                [op.path.join(".")]: "",
              },
            },
          },
        });
      } else {
        operations.push({
          updateOne: {
            filter,
            update: {
              $set: {
                [op.path.join(".")]: op.value,
              },
            },
          },
        });
      }
    } else {
      console.error("unprocessable op", op);
    }
  }
  collection.bulkWrite(operations);
}

module.exports = {
  applyOp,
};
