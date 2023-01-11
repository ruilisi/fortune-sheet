import React, { useCallback, useRef, useState } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Sheet } from "@fortune-sheet/core";

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
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [[{ v: "fortune" }]],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return ref.current?.getCellValue(0, 0);
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetCellValue: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
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
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const ClearCell: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [[{ bg: "green", v: "fortune", m: "fortune" }]],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.clearCell(0, 0);
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetCellFormat: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [[{ v: "set bg = green" }]],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setCellFormat(0, 0, "bg", "green");
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const AutoFillCell: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
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
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
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
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const Freeze: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.freeze("both", { row: 1, column: 1 });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const InsertRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [[{ v: "original" }]],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.insertRowOrColumn("row", 0, 1);
        ref.current?.setCellValue(1, 0, "inserted");
        ref.current?.insertRowOrColumn("column", 0, 1);
        ref.current?.setCellValue(0, 1, "inserted");
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const DeleteRowCol: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [
        [{ v: "0" }],
        [{ v: "1" }],
        [{ v: "2" }],
        [{ v: "3" }],
        [{ v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.deleteRowOrColumn("row", 1, 3);
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const GetRowHeight: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
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
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getRowHeight([0, 1, 2, 3, 4]));
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const GetColumnWidth: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      config: { columnlen: { 2: 200 } },
      data: [[{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }]],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getColumnWidth([0, 1, 2, 3, 4]));
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetRowHeight: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [
        [{ v: "0" }],
        [{ v: "1" }],
        [{ v: "height = 100" }],
        [{ v: "3" }],
        [{ v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setRowHeight({ "2": 100 });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetColumnWidth: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [
        [{ v: "0" }, { v: "1" }, { v: "width = 200" }, { v: "3" }, { v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setColumnWidth({ "2": 200 });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const GetSelection: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      luckysheet_select_save: [{ row: [0, 1], column: [1, 2] }],
      data: [
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getSelection());
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetSelection: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setSelection([{ row: [0, 1], column: [1, 2] }]);
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const MergeCells: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
        [{ v: "0" }, { v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }],
      ],
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.mergeCells([{ row: [0, 1], column: [1, 2] }], "merge-all");
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const GetAllSheets: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      data: [[{ v: "0" }, { v: "1" }]],
      order: 0,
    },
    {
      name: "Sheet2",
      data: [[{ v: "0" }], [{ v: "1" }]],
      order: 1,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.getAllSheets());
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const AddSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    { id: "1", name: "Sheet1", data: [[{ v: "1" }]], order: 0 },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.addSheet();
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const DeleteSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    { id: "1", name: "Sheet1", data: [[{ v: "1" }]], order: 0 },
    { id: "2", name: "Sheet2", data: [[{ v: "2" }]], order: 1 },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.deleteSheet({ id: "2" });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const UpdateSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    { id: "1", name: "sheet1", data: [[{ v: "1" }]], order: 0 },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        // 更新样例
        ref.current?.updateSheet([
          {
            id: "1",
            name: "lvjing",
            data: [[{ v: "1" }]],
            order: 0,
            row: 10,
            column: 20,
            luckysheet_select_save: [
              {
                row: [2, 4],
                column: [4, 6],
                column_focus: 6,
                height: 19,
                height_move: 59,
                left: 444,
                left_move: 296,
                row_focus: 4,
                top: 80,
                top_move: 40,
                width: 73,
                width_move: 221,
              },
            ],
          },
          {
            id: "2",
            name: "lvjing2",
            data: [[{ v: "12" }, { v: "lvjing" }]],
            order: 1,
          },
          {
            id: "3",
            name: "lvjing3",
            celldata: [
              {
                r: 0,
                c: 0,
                v: {
                  v: "1",
                  ct: {
                    fa: "General",
                    t: "n",
                  },
                  m: "1",
                },
              },
              {
                r: 1,
                c: 0,
                v: {
                  mc: {
                    r: 1,
                    c: 0,
                    rs: 2,
                    cs: 2,
                  },
                },
              },
              {
                r: 1,
                c: 1,
                v: {
                  mc: {
                    r: 1,
                    c: 0,
                  },
                },
              },
              {
                r: 2,
                c: 0,
                v: {
                  mc: {
                    r: 1,
                    c: 0,
                  },
                },
              },
              {
                r: 2,
                c: 1,
                v: {
                  mc: {
                    r: 1,
                    c: 0,
                  },
                },
              },
            ],
            row: 20,
            column: 20,
            order: 3,
          },
        ]);
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const ActivateSheet: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    { id: "1", name: "Sheet1", data: [[{ v: "1" }]], order: 0 },
    { id: "2", name: "Sheet2", data: [[{ v: "2" }]], order: 1 },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.activateSheet({ id: "2" });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetSheetName: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.setSheetName("Fortune");
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const SetSheetOrder: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    { id: "1", name: "Sheet1", order: 0 },
    { id: "2", name: "Sheet2", order: 1 },
    { id: "3", name: "Sheet3", order: 2 },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
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
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const Scroll: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        ref.current?.scroll({
          targetRow: 60,
        });
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const Undo: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.handleUndo());
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};

export const Redo: ComponentStory<typeof Workbook> = () => {
  const ref = useRef<WorkbookInstance>(null);
  const [data, setData] = useState<Sheet[]>([
    {
      name: "Sheet1",
      order: 0,
    },
  ]);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <ApiExecContainer
      onRun={() => {
        return JSON.stringify(ref.current?.handleRedo());
      }}
    >
      <Workbook ref={ref} data={data} onChange={onChange} />
    </ApiExecContainer>
  );
};
