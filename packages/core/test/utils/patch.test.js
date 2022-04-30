import {
  patchToOp,
  opToPatch,
  inverseRowColOptions,
} from "../../src/utils/patch";

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
  const opsWithRowInsertion = [
    {
      op: "replace",
      value: ["1"],
      index: "index_1",
      path: ["calcChain"],
    },
    {
      op: "insertRowCol",
      index: "index_1",
      path: [],
      value: {
        type: "row",
        index: 2,
        count: 3,
        direction: "lefttop",
        sheetIndex: "index_1",
      },
    },
  ];
  const opsWithColDeletion = [
    {
      op: "replace",
      value: ["1"],
      index: "index_1",
      path: ["calcChain"],
    },
    {
      op: "deleteRowCol",
      index: "index_1",
      path: [],
      value: {
        type: "column",
        start: 2,
        end: 3,
        sheetIndex: "index_1",
      },
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

  it("patchToOp with row/col insertion", async () => {
    const newOps = patchToOp(
      context,
      [
        {
          op: "replace",
          value: { bl: 1 },
          path: ["luckysheetfile", 0, "data", 1, 1],
        },
        {
          op: "replace",
          value: { cl: 2 },
          path: ["luckysheetfile", 1, "data", 2, 1],
        },
        {
          op: "replace",
          value: ["1"],
          path: ["luckysheetfile", 0, "calcChain"],
        },
      ],
      {
        insertRowColOp: {
          type: "row",
          index: 2,
          count: 3,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
      }
    );

    expect(newOps).toEqual(opsWithRowInsertion);
  });

  it("patchToOp with row/col deletion", async () => {
    const newOps = patchToOp(
      context,
      [
        {
          op: "replace",
          value: { bl: 1 },
          path: ["luckysheetfile", 0, "data", 1, 1],
        },
        {
          op: "replace",
          value: { cl: 2 },
          path: ["luckysheetfile", 1, "data", 2, 1],
        },
        {
          op: "replace",
          value: ["1"],
          path: ["luckysheetfile", 0, "calcChain"],
        },
      ],
      {
        deleteRowColOp: {
          type: "column",
          start: 2,
          end: 3,
          sheetIndex: "index_1",
        },
      }
    );

    expect(newOps).toEqual(opsWithColDeletion);
  });

  it("patchToOp with row/col insertion and restoreDeletedCells", async () => {
    const newOps = patchToOp(
      {
        currentSheetIndex: "index_1",
        luckysheetfile: [
          {
            index: "index_1",
            data: [
              [{ v: "00" }, { v: "01" }, null, null, { v: "04" }],
              [{ v: "10" }, null, null, { v: "13" }, null],
              [null, { v: "21" }, null, null, { v: "24" }],
              [{ v: "30" }, { v: "31" }, null, null, { v: "34" }],
            ],
          },
        ],
      },
      [
        {
          op: "replace",
          value: { bl: 1 },
          path: ["luckysheetfile", 0, "data", 1, 1],
        },
        {
          op: "replace",
          value: { cl: 2 },
          path: ["luckysheetfile", 0, "data", 2, 1],
        },
        {
          op: "replace",
          value: ["1"],
          path: ["luckysheetfile", 0, "calcChain"],
        },
      ],
      {
        insertRowColOp: {
          type: "row",
          index: 1,
          count: 2,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
        restoreDeletedCells: true,
      }
    );

    expect(newOps).toEqual([
      {
        op: "replace",
        value: ["1"],
        index: "index_1",
        path: ["calcChain"],
      },
      {
        op: "insertRowCol",
        index: "index_1",
        path: [],
        value: {
          type: "row",
          index: 1,
          count: 2,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
      },
      {
        op: "replace",
        value: { v: "10" },
        index: "index_1",
        path: ["data", 1, 0],
      },
      {
        op: "replace",
        value: { v: "13" },
        index: "index_1",
        path: ["data", 1, 3],
      },
      {
        op: "replace",
        value: { v: "21" },
        index: "index_1",
        path: ["data", 2, 1],
      },
      {
        op: "replace",
        value: { v: "24" },
        index: "index_1",
        path: ["data", 2, 4],
      },
    ]);
  });

  it("patchToOp with row insertion and formula cells", async () => {
    const newOps = patchToOp(
      context,
      [
        {
          op: "replace",
          value: { bl: 1 },
          path: ["luckysheetfile", 0, "data", 1, 1],
        },
        {
          op: "replace",
          value: { cl: 2 },
          path: ["luckysheetfile", 0, "data", 2, 1],
        },
        {
          op: "replace",
          value: [{ cl: 2 }, null, null, { f: "f1" }, null, { f: "f2" }],
          path: ["luckysheetfile", 0, "data", 3],
        },
        {
          op: "replace",
          value: ["1"],
          path: ["luckysheetfile", 0, "calcChain"],
        },
      ],
      {
        insertRowColOp: {
          type: "row",
          index: 1,
          count: 2,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
      }
    );
    expect(newOps).toEqual([
      {
        op: "replace",
        value: ["1"],
        index: "index_1",
        path: ["calcChain"],
      },
      {
        op: "insertRowCol",
        index: "index_1",
        path: [],
        value: {
          type: "row",
          index: 1,
          count: 2,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
      },
      {
        op: "replace",
        value: { f: "f1" },
        index: "index_1",
        path: ["data", 3, 3],
      },
      {
        op: "replace",
        value: { f: "f2" },
        index: "index_1",
        path: ["data", 3, 5],
      },
    ]);
  });

  it("patchToOp with column deletion and formula cells", async () => {
    const newOps = patchToOp(
      context,
      [
        {
          op: "replace",
          value: { bl: 1 },
          path: ["luckysheetfile", 0, "data", 1, 1],
        },
        {
          op: "replace",
          value: { cl: 2 },
          path: ["luckysheetfile", 0, "data", 2, 1],
        },
        {
          op: "replace",
          value: { f: "f1" },
          path: ["luckysheetfile", 0, "data", 3, 3],
        },
        {
          op: "replace",
          value: { f: "f2" },
          path: ["luckysheetfile", 0, "data", 3, 5],
        },
        {
          op: "replace",
          value: ["1"],
          path: ["luckysheetfile", 0, "calcChain"],
        },
      ],
      {
        deleteRowColOp: {
          type: "column",
          start: 2,
          end: 3,
          sheetIndex: "index_1",
        },
      }
    );
    expect(newOps).toEqual([
      {
        op: "replace",
        value: ["1"],
        index: "index_1",
        path: ["calcChain"],
      },
      {
        op: "deleteRowCol",
        index: "index_1",
        path: [],
        value: {
          type: "column",
          start: 2,
          end: 3,
          sheetIndex: "index_1",
        },
      },
      {
        op: "replace",
        value: { f: "f1" },
        index: "index_1",
        path: ["data", 3, 3],
      },
      {
        op: "replace",
        value: { f: "f2" },
        index: "index_1",
        path: ["data", 3, 5],
      },
    ]);
  });

  it("opToPatch", async () => {
    const [newPatches, rowcolOps] = opToPatch(context, ops);
    expect(newPatches).toEqual(patches);
    expect(rowcolOps.length).toEqual(0);
  });

  it("opToPatch with row/col insertion", async () => {
    const [newPatches, rowcolOps] = opToPatch(context, opsWithRowInsertion);
    expect(newPatches).toEqual([
      {
        op: "replace",
        value: ["1"],
        path: ["luckysheetfile", 0, "calcChain"],
      },
    ]);
    expect(rowcolOps).toEqual([
      {
        op: "insertRowCol",
        index: "index_1",
        path: [],
        value: {
          type: "row",
          index: 2,
          count: 3,
          direction: "lefttop",
          sheetIndex: "index_1",
        },
      },
    ]);
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

  it("inverseRowColOptions insertRowCol", async () => {
    const reverseOp = inverseRowColOptions({
      insertRowColOp: {
        type: "row",
        index: 2,
        count: 3,
        direction: "lefttop",
        sheetIndex: "index_1",
      },
    });
    expect(reverseOp).toEqual({
      deleteRowColOp: {
        type: "row",
        start: 2,
        end: 4,
        sheetIndex: "index_1",
      },
    });
  });

  it("inverseRowColOptions insertRowCol rightbottom", async () => {
    const reverseOp = inverseRowColOptions({
      insertRowColOp: {
        type: "row",
        index: 2,
        count: 3,
        direction: "rightbottom",
        sheetIndex: "index_1",
      },
    });
    expect(reverseOp).toEqual({
      deleteRowColOp: {
        type: "row",
        start: 3,
        end: 5,
        sheetIndex: "index_1",
      },
    });
  });

  it("inverseRowColOptions deleteRowCol", async () => {
    const reverseOp = inverseRowColOptions({
      deleteRowColOp: {
        type: "row",
        start: 2,
        end: 4,
        sheetIndex: "index_1",
      },
    });
    expect(reverseOp).toEqual({
      insertRowColOp: {
        type: "row",
        index: 2,
        count: 3,
        direction: "lefttop",
        sheetIndex: "index_1",
      },
    });
  });

  it("inverseRowColOptions returns original object if row/col op not exist", async () => {
    const reverseOp = inverseRowColOptions({});
    expect(reverseOp).toEqual({});
  });
});
