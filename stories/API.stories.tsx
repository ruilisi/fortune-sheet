import React, { useRef, useEffect } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

export const SetCellValue: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    for (let i = 0; i < 5; i += 1) {
      for (let j = 0; j < 5; j += 1) {
        ref.current?.setCellValue(i, j, `${i + j}`);
      }
    }
    ref.current?.setCellValue(0, 5, "=SUM(A1:E1)");
    ref.current?.setCellValue(1, 5, "=SUM(A2:E2)");
    ref.current?.setCellValue(2, 5, "=SUM(A3:E3)");
    ref.current?.setCellValue(3, 5, "=SUM(A4:E4)");
    ref.current?.setCellValue(4, 5, "=SUM(A5:E5)");
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook ref={ref} data={[{ name: "Sheet1" }]} />
    </div>
  );
};

export const ClearCell: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.clearCell(0, 0);
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [[{ bg: "green", v: "fortune", m: "fortune" }]],
          },
        ]}
      />
    </div>
  );
};

export const SetCellFormat: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.setCellFormat(0, 0, "bg", "green");
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            config: { columnlen: { "0": 120 } },
            data: [[{ v: "set bg = green" }]],
          },
        ]}
      />
    </div>
  );
};

export const Freeze: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.freeze("both", { row: 1, column: 1 });
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
          },
        ]}
      />
    </div>
  );
};

export const InsertRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.insertRowOrColumn("row", 0, 1);
    ref.current?.setCellValue(1, 0, "inserted");
    ref.current?.insertRowOrColumn("column", 0, 1);
    ref.current?.setCellValue(0, 1, "inserted");
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [[{ v: "original" }]],
          },
        ]}
      />
    </div>
  );
};

export const DeleteRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.deleteRowOrColumn("row", 1, 3);
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [
              [{ v: "0" }],
              [{ v: "1" }],
              [{ v: "2" }],
              [{ v: "3" }],
              [{ v: "4" }],
            ],
          },
        ]}
      />
    </div>
  );
};

export const SetRowHeight: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.setRowHeight({ "2": 100 });
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [
              [{ v: "0" }],
              [{ v: "1" }],
              [{ v: "height = 100" }],
              [{ v: "3" }],
              [{ v: "4" }],
            ],
          },
        ]}
      />
    </div>
  );
};

export const SetColumnWidth: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  useEffect(() => {
    ref.current?.setColumnWidth({ "2": 200 });
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [
              [
                { v: "0" },
                { v: "1" },
                { v: "width = 200" },
                { v: "3" },
                { v: "4" },
              ],
            ],
          },
        ]}
      />
    </div>
  );
};
