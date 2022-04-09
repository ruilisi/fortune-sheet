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
    if (
      path.length >= 3 &&
      path[0] === "data" &&
      _.isNumber(path[1]) &&
      _.isNumber(path[2])
    ) {
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
    } else if (path[0] !== "data") {
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
