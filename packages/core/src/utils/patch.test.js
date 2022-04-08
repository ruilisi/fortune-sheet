import { patchToOp, opToPatch } from "./patch";

describe("patch", () => {
  const context = {
    luckysheetfile: [
      {
        index: "index_1",
      },
      {
        index: "index_2",
      },
    ],
  };
  const ops = [
    {
      op: "add",
      value: 1,
      index: "index_1",
      path: ["data", 1, 1, "bl"],
    },
    {
      op: "add",
      value: 1,
      index: "index_2",
      path: ["data", 2, 1, "cl"],
    },
  ];
  const patches = [
    {
      op: "add",
      value: 1,
      path: ["luckysheetfile", 0, "data", 1, 1, "bl"],
    },
    {
      op: "add",
      value: 1,
      path: ["luckysheetfile", 1, "data", 2, 1, "cl"],
    },
  ];

  it("patchToOp", async () => {
    const newOps = patchToOp(context, patches);
    expect(newOps).toEqual(ops);
  });

  it("opToPatch", async () => {
    const newPatches = opToPatch(context, ops);
    expect(newPatches).toEqual(patches);
  });

  it("opToPatch throws when no index found", async () => {
    const wrongContext = {
      luckysheetfile: [
        {
          index: "index_3",
        },
      ],
    };
    expect(() => {
      opToPatch(wrongContext, ops);
    }).toThrow();
  });
});
