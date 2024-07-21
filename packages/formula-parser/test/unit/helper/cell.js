import {
  extractLabel,
  toLabel,
  columnIndexToLabel,
  columnLabelToIndex,
  rowIndexToLabel,
  rowLabelToIndex,
} from "../../../src/helper/cell";

describe(".extractLabel()", () => {
  it("should correctly extract coordinates", () => {
    expect(extractLabel("A1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: false,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: false,
      },
    ]);
    expect(extractLabel("a1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: false,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: false,
      },
    ]);
    expect(extractLabel("A$1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: true,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: false,
      },
    ]);
    expect(extractLabel("a$1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: true,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: false,
      },
    ]);
    expect(extractLabel("$A1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: false,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: true,
      },
    ]);
    expect(extractLabel("$A$1")).toMatchObject([
      {
        index: 0,
        label: "1",
        isAbsolute: true,
      },
      {
        index: 0,
        label: "A",
        isAbsolute: true,
      },
    ]);
    expect(extractLabel("$AG199")).toMatchObject([
      {
        index: 198,
        label: "199",
        isAbsolute: false,
      },
      {
        index: 32,
        label: "AG",
        isAbsolute: true,
      },
    ]);
    expect(extractLabel("$Ag199")).toMatchObject([
      {
        index: 198,
        label: "199",
        isAbsolute: false,
      },
      {
        index: 32,
        label: "AG",
        isAbsolute: true,
      },
    ]);
    expect(extractLabel("$$AG199")).toMatchObject([]);
    expect(extractLabel("AG$$199")).toMatchObject([]);
    expect(extractLabel(null)).toMatchObject([]);
    expect(extractLabel(void 0)).toMatchObject([]);
    expect(extractLabel(0)).toMatchObject([]);
  });
});

describe(".toLabel()", () => {
  it("should correctly convert coords to label ", () => {
    expect(
      toLabel({ index: 0, isAbsolute: false }, { index: 0, isAbsolute: false })
    ).toBe("A1");
    expect(
      toLabel({ index: 0, isAbsolute: true }, { index: 0, isAbsolute: false })
    ).toBe("A$1");
    expect(
      toLabel({ index: 0, isAbsolute: true }, { index: 0, isAbsolute: true })
    ).toBe("$A$1");
    expect(
      toLabel({ index: 44, isAbsolute: true }, { index: 20, isAbsolute: true })
    ).toBe("$U$45");
    expect(
      toLabel({ index: 1, isAbsolute: false }, { index: 20, isAbsolute: true })
    ).toBe("$U2");
  });
});

describe(".columnIndexToLabel()", () => {
  it("should correctly convert column index to label ", () => {
    expect(columnIndexToLabel(-100)).toBe("");
    expect(columnIndexToLabel(-1)).toBe("");
    expect(columnIndexToLabel(0)).toBe("A");
    expect(columnIndexToLabel(1)).toBe("B");
    expect(columnIndexToLabel(10)).toBe("K");
    expect(columnIndexToLabel(100)).toBe("CW");
    expect(columnIndexToLabel(1000)).toBe("ALM");
    expect(columnIndexToLabel(10000)).toBe("NTQ");
  });
});

describe(".columnLabelToIndex()", () => {
  it("should correctly convert column label to index", () => {
    expect(columnLabelToIndex("")).toBe(-1);
    expect(columnLabelToIndex("")).toBe(-1);
    expect(columnLabelToIndex("A")).toBe(0);
    expect(columnLabelToIndex("B")).toBe(1);
    expect(columnLabelToIndex("K")).toBe(10);
    expect(columnLabelToIndex("k")).toBe(10);
    expect(columnLabelToIndex("CW")).toBe(100);
    expect(columnLabelToIndex("ALM")).toBe(1000);
    expect(columnLabelToIndex("aLM")).toBe(1000);
    expect(columnLabelToIndex("NTQ")).toBe(10000);
  });
});

describe(".rowIndexToLabel()", () => {
  it("should correctly convert row index to label ", () => {
    expect(rowIndexToLabel(-100)).toBe("");
    expect(rowIndexToLabel(-1)).toBe("");
    expect(rowIndexToLabel(0)).toBe("1");
    expect(rowIndexToLabel(1)).toBe("2");
    expect(rowIndexToLabel(10)).toBe("11");
    expect(rowIndexToLabel(100)).toBe("101");
  });
});

describe(".rowLabelToIndex()", () => {
  it("should correctly convert row label to index", () => {
    expect(rowLabelToIndex("")).toBe(-1);
    expect(rowLabelToIndex("0")).toBe(-1);
    expect(rowLabelToIndex("1")).toBe(0);
    expect(rowLabelToIndex("2")).toBe(1);
    expect(rowLabelToIndex("100")).toBe(99);
    expect(rowLabelToIndex("92")).toBe(91);
  });
});
