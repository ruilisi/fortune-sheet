import { Context } from "../../packages/core/src";

export function luckysheetSlectSave(
  row: number[],
  column: number[],
  row_focus: number,
  column_focus: number
) {
  return [
    {
      row,
      column,
      row_focus,
      column_focus,
    },
  ];
}

export function context({
  ...params
}: Partial<Context> = {}): Partial<Context> {
  return {
    currentSheetIndex: "index_1",
    allowEdit: true,
    config: {},
    luckysheet_select_save: [
      {
        row: [0, 0],
        column: [1, 1],
        row_focus: 0,
        column_focus: 0,
      },
    ],
    luckysheetfile: [
      {
        name: "sheet",
        index: "index_1",
        data: [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
      },
    ],
    visibledatarow: [20, 40],
    visibledatacolumn: [74, 148],
    zoomRatio: 1,
    ...params,
  };
}
