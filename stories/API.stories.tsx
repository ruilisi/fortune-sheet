import React, { useRef, useState } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const ApiExecContainer: React.FC<{ onRun: () => any }> = ({
  children,
  onRun,
}) => {
  const [result, setResult] = useState<string>();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ flexShrink: 0, padding: 8 }}>
        <button
          type="button"
          onClick={() => {
            setResult(onRun?.());
          }}
        >
          Run
        </button>
        <span style={{ marginLeft: 16 }}>
          {result && (
            <>
              <span style={{ color: "#aaa" }}>result: </span> {result}
            </>
          )}
        </span>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

export const GetCellValue: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return ref.current?.getCellValue(0, 0);
      }}
    >
      <Workbook
        ref={ref}
        data={[{ name: "Sheet1", data: [[{ v: "fortune" }]] }]}
      />
    </ApiExecContainer>
  );
};

export const SetCellValue: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
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
      }}
    >
      <Workbook ref={ref} data={[{ name: "Sheet1" }]} />
    </ApiExecContainer>
  );
};

export const ClearCell: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.clearCell(0, 0);
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [[{ bg: "green", v: "fortune", m: "fortune" }]],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const SetCellFormat: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setCellFormat(0, 0, "bg", "green");
      }}
    >
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
    </ApiExecContainer>
  );
};

export const AutoFillCell: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.autoFillCell(
          { row: [0, 1], column: [0, 1] },
          { row: [2, 9], column: [0, 1] },
          "down"
        );
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            config: { columnlen: { "0": 120 } },
            data: [
              [
                { m: "1", v: 1, ct: { t: "n", fa: "General" } },
                { m: "2", v: 2, ct: { t: "n", fa: "General" } },
              ],
              [
                { m: "2", v: 2, ct: { t: "n", fa: "General" } },
                { m: "4", v: 4, ct: { t: "n", fa: "General" } },
              ],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
              [null, null],
            ],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const Freeze: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.freeze("both", { row: 1, column: 1 });
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const InsertRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.insertRowOrColumn("row", 0, 1);
        ref.current?.setCellValue(1, 0, "inserted");
        ref.current?.insertRowOrColumn("column", 0, 1);
        ref.current?.setCellValue(0, 1, "inserted");
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [[{ v: "original" }]],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const DeleteRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.deleteRowOrColumn("row", 1, 3);
      }}
    >
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
    </ApiExecContainer>
  );
};

export const GetRowHeight: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getRowHeight([0, 1, 2, 3, 4]));
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            config: { rowlen: { 2: 200 } },
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
    </ApiExecContainer>
  );
};

export const GetColumnWidth: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getColumnWidth([0, 1, 2, 3, 4]));
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            config: { columnlen: { 2: 200 } },
            data: [
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
            ],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const SetRowHeight: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setRowHeight({ "2": 100 });
      }}
    >
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
    </ApiExecContainer>
  );
};

export const SetColumnWidth: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setColumnWidth({ "2": 200 });
      }}
    >
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
    </ApiExecContainer>
  );
};

export const GetSelection: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getSelection());
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            luckysheet_select_save: [{ row: [0, 1], column: [1, 2] }],
            data: [
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
            ],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const SetSelection: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setSelection([{ row: [0, 1], column: [1, 2] }]);
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
            ],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const MergeCells: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.mergeCells([{ row: [0, 1], column: [1, 2] }], "merge-all");
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
              [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
            ],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const GetAllSheets: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getAllSheets());
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
            data: [[{ v: "0" }, { v: "1" }]],
          },
          {
            name: "Sheet2",
            data: [[{ v: "0" }], [{ v: "1" }]],
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const AddSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.addSheet();
      }}
    >
      <Workbook ref={ref} data={[{ name: "Sheet1", data: [[{ v: "1" }]] }]} />
    </ApiExecContainer>
  );
};

export const DeleteSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.deleteSheet({ id: "2" });
      }}
    >
      <Workbook
        ref={ref}
        data={[
          { id: "1", name: "Sheet1", data: [[{ v: "1" }]] },
          { id: "2", name: "Sheet2", data: [[{ v: "2" }]] },
        ]}
      />
    </ApiExecContainer>
  );
};

export const ActivateSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.activateSheet({ id: "2" });
      }}
    >
      <Workbook
        ref={ref}
        data={[
          { id: "1", name: "Sheet1", data: [[{ v: "1" }]] },
          { id: "2", name: "Sheet2", data: [[{ v: "2" }]] },
        ]}
      />
    </ApiExecContainer>
  );
};

export const SetSheetName: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setSheetName("Fortune");
      }}
    >
      <Workbook ref={ref} data={[{ name: "Sheet1" }]} />
    </ApiExecContainer>
  );
};

export const SetSheetOrder: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setSheetOrder({
          "1": 3,
          "2": 1,
          "3": 2,
        });
      }}
    >
      <Workbook
        ref={ref}
        data={[
          { id: "1", name: "Sheet1" },
          { id: "2", name: "Sheet2" },
          { id: "3", name: "Sheet3" },
        ]}
      />
    </ApiExecContainer>
  );
};

export const Scroll: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.scroll({
          targetRow: 60,
        });
      }}
    >
      <Workbook ref={ref} data={[{ name: "Sheet1" }]} />
    </ApiExecContainer>
  );
};

export const Undo: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.handleUndo());
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
          },
        ]}
      />
    </ApiExecContainer>
  );
};

export const Redo: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.handleRedo());
      }}
    >
      <Workbook
        ref={ref}
        data={[
          {
            name: "Sheet1",
          },
        ]}
      />
    </ApiExecContainer>
  );
};
