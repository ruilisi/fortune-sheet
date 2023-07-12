import { Context, PrintConfig, getSheetByIndex } from "@fortune-sheet/core";
import _, { max } from "lodash";

type CellRange = { row: [number, number]; column: [number, number] };
// 打印的纸张大小
export const pageSizeMap = {
  a4: {
    width: 794,
    height: 1123,
  },
};

function getPageSize({ size, pageOrientation }: PrintConfig) {
  const pageSize = { ...pageSizeMap[size ?? "a4"] };
  if (pageOrientation === "rotate-left" || pageOrientation === "rotate-right") {
    const temp = pageSize.width;
    pageSize.width = pageSize.height;
    pageSize.height = temp;
  }
  return pageSize;
}

export type PrintPageRange = {
  leftTopPosition: { x: number; y: number };
  range: {
    row: [number, number];
    column: [number, number];
  };
};

function splitPosition(arr: number[], splitLength: number) {
  let prePosition = 0;
  // 计算分割线位置
  // 没到上限继续下一个
  const splitDividerPosition = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] - prePosition < splitLength) {
      continue;
    }
    splitDividerPosition.push(i - 1);
    prePosition = arr[i - 1];
  }
  if (_.last(splitDividerPosition) !== arr.length - 1) {
    splitDividerPosition.push(arr.length - 1);
  }
  return splitDividerPosition;
}

export function getCellRange(
  context: Context,
  id: string,
  options: { type: "value" | "all" }
): CellRange {
  const sheet = getSheetByIndex(context, id);
  const data = sheet?.data;
  const maxRange: CellRange = { row: [0, 0], column: [0, 0] };
  if (options.type === "all") {
    maxRange.row[1] = (data?.length ?? 1) - 1;
    maxRange.column[1] = (data?.[0]?.length ?? 1) - 1;
  } else {
    data?.forEach((row, rowIndex) => {
      row?.forEach((item, columnIndex) => {
        if (item) {
          maxRange.column[1] = max([maxRange.column[1], columnIndex]) ?? 0;
          maxRange.row[1] = max([maxRange.row[1], rowIndex]) ?? 0;
        }
      });
    });
  }
  return maxRange;
}

export function computePrintPage(
  context: Context,
  range: CellRange
): {
  orientation: NonNullable<PrintConfig["pageOrientation"]>;
  printPages: PrintPageRange[];
  divider: {
    row: number[];
    column: number[];
  };
} {
  // 根据行列 像素 分割区域图形
  const maxRange = range;
  if (!context.config.print) {
    return {
      orientation: "upright",
      printPages: [],
      divider: {
        row: [],
        column: [],
      },
    };
  }
  // 拆分表格
  const pageSize = getPageSize(context.config.print);

  const rowHeight = context.visibledatarow;
  const columnWidth = context.visibledatacolumn;
  // 计算分割线位置
  // 没到上限继续下一个
  const rowDivider = splitPosition(
    _.range(maxRange.row[0], maxRange.row[1] + 1).map((i) => rowHeight[i]),
    pageSize.height
  );
  const columnDivider = splitPosition(
    _.range(maxRange.column[0], maxRange.column[1] + 1).map(
      (i) => columnWidth[i]
    ),
    pageSize.width
  );

  // 拼接打印范围;
  // 横竖排序，采用

  const pages: PrintPageRange[] = [];
  rowDivider.forEach((rowSplit, rowIndex) => {
    columnDivider.forEach((columnSplit, columnIndex) => {
      const startColumnSplitIndex = (columnDivider[columnIndex - 1] ?? -1) + 1;
      const startRowSplitIndex = (rowDivider[rowIndex - 1] ?? -1) + 1;
      pages.push({
        leftTopPosition: {
          x: (columnWidth[startColumnSplitIndex - 1] ?? 0) - 2.0,
          y: (rowHeight[startRowSplitIndex - 1] ?? 0) - 2.5,
        },
        range: {
          row: [startRowSplitIndex, rowSplit],
          column: [startColumnSplitIndex, columnSplit],
        },
      });
    });
  });

  return {
    orientation: context.config.print.pageOrientation ?? "upright",
    printPages: pages,
    divider: {
      row: rowDivider.map((item) => rowHeight[item]),
      column: columnDivider.map((item) => columnWidth[item]),
    },
  };
}
