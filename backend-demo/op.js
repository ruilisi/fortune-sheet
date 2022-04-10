const _ = require("lodash");

/**
 * @param {import("mongodb").Collection} collection mongodb collection
 * @param {any[]} ops op list
 */
async function applyOp(collection, ops) {
  // eslint-disable-next-line no-restricted-syntax
  for (const op of ops) {
    const { path, index } = op;
    const filter = { index };
    if (op.op === "insertRowCol") {
      const field = op.value.type === "row" ? "r" : "c";
      let insertPos = op.value.index;
      if (op.value.direction === "rightbottom") {
        insertPos += 1;
      }
      collection.updateOne(
        filter,
        {
          $inc: {
            [`celldata.$[e].${field}`]: op.value.count,
          },
        },
        { arrayFilters: [{ [`e.${field}`]: { $gte: insertPos } }] }
      );
    } else if (op.op === "deleteRowCol") {
      const field = op.value.type === "row" ? "r" : "c";
      // delete cells
      // eslint-disable-next-line no-await-in-loop
      await collection.updateOne(filter, {
        $pull: {
          celldata: {
            [field]: {
              $gte: op.value.start,
              $lte: op.value.end,
            },
          },
        },
      });
      // decr indexes
      collection.updateOne(
        filter,
        {
          $inc: {
            [`celldata.$[e].${field}`]: -(op.value.end - op.value.start + 1),
          },
        },
        { arrayFilters: [{ [`e.${field}`]: { $gte: op.value.start } }] }
      );
    } else if (
      path.length >= 3 &&
      path[0] === "data" &&
      _.isNumber(path[1]) &&
      _.isNumber(path[2])
    ) {
      // cell update
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
        // eslint-disable-next-line no-await-in-loop
        const cellExists = await collection.findOne({
          ...filter,
          celldata: {
            $elemMatch: {
              r,
              c,
            },
          },
        });
        if (cellExists) {
          collection.updateOne(filter, updater, options);
        } else {
          collection.updateOne(filter, {
            $addToSet: {
              celldata: {
                r,
                c,
                v: op.value,
              },
            },
          });
        }
      } else {
        collection.updateOne(filter, updater, options);
      }
    } else if (path.length === 2 && path[0] === "data" && _.isNumber(path[1])) {
      // entire row operation
      console.error("row assigning not supported");
    } else if (path[0] !== "data") {
      // other config update
      if (op.op === "remove") {
        collection.updateOne(filter, {
          $unset: {
            [op.path.join(".")]: "",
          },
        });
      } else {
        collection.updateOne(filter, {
          $set: {
            [op.path.join(".")]: op.value,
          },
        });
      }
    } else {
      console.error("unprocessable op", op);
    }
  }
}

module.exports = {
  applyOp,
};
