import {
  getCellValue,
  getDropdownList,
  getFlowdata,
  getSheetIndex,
  mergeBorder,
  setDropcownValue,
} from "@fortune-sheet/core";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import WorkbookContext from "../../context";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import SVGIcon from "../SVGIcon";

import "./index.css";

const DropDownList: React.FC = () => {
  // State for keyboard navigation
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  // State for live filter text
  const [filterText, setFilterText] = useState("");
  const { context, setContext } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<any[]>([]);
  const [isMul, setIsMul] = useState<boolean>(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [selected, setSelected] = useState<any[]>([]);

  // Prevent worksheet scroll when scrolling in dropdown
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleWheel = (e: WheelEvent) => {
      // Stop propagation to prevent worksheet from scrolling
      e.stopPropagation();
    };

    container.addEventListener("wheel", handleWheel, { passive: true });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Handle keyboard navigation globally when dropdown is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (list.length === 0) return;

      if (e.key === "ArrowDown") {
        queueMicrotask(() => {
          setActiveIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
        });
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "ArrowUp") {
        queueMicrotask(() => {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
        });
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "Enter" && activeIndex >= 0) {
        const v = list[activeIndex];
        if (v !== undefined) {
          setContext((ctx) => {
            const arr = isMul ? selected.slice() : [];
            const index = arr.indexOf(v);
            if (index < 0) {
              arr.push(v);
            } else {
              arr.splice(index, 1);
            }
            setSelected(arr);
            setDropcownValue(ctx, v, arr);
            // Close dropdown and exit edit mode after selection
            if (!isMul) {
              ctx.dataVerificationDropDownList = false;
              ctx.luckysheetCellUpdate = [];

              // Move cursor to cell below
              if (
                ctx.luckysheet_select_save &&
                ctx.luckysheet_select_save.length > 0
              ) {
                const currentSelection =
                  ctx.luckysheet_select_save[
                    ctx.luckysheet_select_save.length - 1
                  ];
                const nextRow =
                  (currentSelection.row_focus ?? currentSelection.row[0]) + 1;
                const col =
                  currentSelection.column_focus ?? currentSelection.column[0];

                ctx.luckysheet_select_save = [
                  {
                    row: [nextRow, nextRow],
                    column: [col, col],
                    row_focus: nextRow,
                    column_focus: col,
                  },
                ];
              }
            }
          });
        }
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "Tab" && activeIndex >= 0) {
        const v = list[activeIndex];
        if (v !== undefined) {
          setContext((ctx) => {
            const arr = isMul ? selected.slice() : [];
            const index = arr.indexOf(v);
            if (index < 0) {
              arr.push(v);
            } else {
              arr.splice(index, 1);
            }
            setSelected(arr);
            setDropcownValue(ctx, v, arr);
            // Close dropdown and exit edit mode after selection
            if (!isMul) {
              ctx.dataVerificationDropDownList = false;
              ctx.luckysheetCellUpdate = [];

              // Move cursor to cell on the right
              if (
                ctx.luckysheet_select_save &&
                ctx.luckysheet_select_save.length > 0
              ) {
                const currentSelection =
                  ctx.luckysheet_select_save[
                    ctx.luckysheet_select_save.length - 1
                  ];
                const row =
                  currentSelection.row_focus ?? currentSelection.row[0];
                const nextCol =
                  (currentSelection.column_focus ??
                    currentSelection.column[0]) + (e.shiftKey ? -1 : 1);

                ctx.luckysheet_select_save = [
                  {
                    row: [row, row],
                    column: [nextCol, nextCol],
                    row_focus: row,
                    column_focus: nextCol,
                  },
                ];
              }
            }
          });
        }
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [list, activeIndex, isMul, selected, setContext]);

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.dataVerificationDropDownList = false;
    });
  }, [setContext]);

  useOutsideClick(containerRef, close, [close]);

  // 初始化
  useEffect(() => {
    // Wrap all state updates to avoid updating during render
    const updateState = () => {
      if (!context.luckysheet_select_save) return;
      const last =
        context.luckysheet_select_save[
          context.luckysheet_select_save.length - 1
        ];
      const rowIndex = last.row_focus;
      const colIndex = last.column_focus;
      if (rowIndex == null || colIndex == null) return;
      let row = context.visibledatarow[rowIndex];
      let col_pre =
        colIndex === 0 ? 0 : context.visibledatacolumn[colIndex - 1];
      const d = getFlowdata(context);
      if (!d) return;
      const margeSet = mergeBorder(context, d, rowIndex, colIndex);
      if (margeSet) {
        [, row] = margeSet.row;
        [col_pre, ,] = margeSet.column;
      }
      const index = getSheetIndex(context, context.currentSheetId) as number;
      const { dataVerification } = context.luckysheetfile[index];
      if (!dataVerification) return;
      const item = dataVerification[`${rowIndex}_${colIndex}`];
      const dropdownList = item ? getDropdownList(context, item.value1) : [];
      // Filter dropdown list by cell input value
      const cellValue = getCellValue(rowIndex, colIndex, d);
      const filteredList = filterText
        ? dropdownList.filter(
            (listItem) =>
              listItem &&
              String(listItem).toLowerCase().includes(filterText.toLowerCase())
          )
        : dropdownList;

      // Batch all state updates together using queueMicrotask
      queueMicrotask(() => {
        if (cellValue) {
          setSelected(cellValue.toString().split(","));
        }
        setList(filteredList);
        setPosition({
          left: col_pre,
          top: row,
        });
        setIsMul(item && item.type2 === "true");
      });
    };

    updateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheetCellUpdate, filterText]);
  // Live update filterText on cell input change using MutationObserver
  useEffect(() => {
    const input = document.getElementById("luckysheet-rich-text-editor");
    if (!input) return undefined;
    const observer = new MutationObserver(() => {
      // Defer state update to avoid updating during render
      queueMicrotask(() => {
        setFilterText(input.textContent || "");
      });
    });
    observer.observe(input, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // Initial set
    queueMicrotask(() => {
      setFilterText(input.textContent || "");
    });
    return () => observer.disconnect();
  }, [context.luckysheetCellUpdate]);

  // 设置下拉列表的值
  useEffect(() => {
    if (!context.luckysheet_select_save) return;
    const last =
      context.luckysheet_select_save[context.luckysheet_select_save.length - 1];
    const rowIndex = last.row_focus;
    const colIndex = last.column_focus;
    if (rowIndex == null || colIndex == null) return;
    const index = getSheetIndex(context, context.currentSheetId) as number;
    const { dataVerification } = context.luckysheetfile[index];
    if (!dataVerification) return;
    const item = dataVerification[`${rowIndex}_${colIndex}`];
    if (!item || item.type2 !== "true") return;
    const d = getFlowdata(context);
    if (!d) return;
    const cellValue = getCellValue(rowIndex, colIndex, d);
    if (cellValue) {
      setSelected(cellValue.toString().split(","));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheetfile]);

  // Reset activeIndex when list changes
  useEffect(() => {
    setActiveIndex(list.length > 0 ? 0 : -1);
  }, [list]);

  return (
    <div
      id="luckysheet-dataVerification-dropdown-List"
      style={position}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => e.stopPropagation()}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (list.length === 0) return;
        if (e.key === "ArrowDown") {
          setActiveIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
          e.preventDefault();
        } else if (e.key === "ArrowUp") {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
          e.preventDefault();
        } else if (e.key === "Enter" && activeIndex >= 0) {
          const v = list[activeIndex];
          if (v !== undefined) {
            setContext((ctx) => {
              const arr = isMul ? selected.slice() : [];
              const index = arr.indexOf(v);
              if (index < 0) {
                arr.push(v);
              } else {
                arr.splice(index, 1);
              }
              setSelected(arr);
              setDropcownValue(ctx, v, arr);
              // Close dropdown and exit edit mode after selection
              if (!isMul) {
                ctx.dataVerificationDropDownList = false;
                ctx.luckysheetCellUpdate = [];

                // Move cursor to cell below
                if (
                  ctx.luckysheet_select_save &&
                  ctx.luckysheet_select_save.length > 0
                ) {
                  const currentSelection =
                    ctx.luckysheet_select_save[
                      ctx.luckysheet_select_save.length - 1
                    ];
                  const nextRow =
                    (currentSelection.row_focus ?? currentSelection.row[0]) + 1;
                  const col =
                    currentSelection.column_focus ?? currentSelection.column[0];

                  ctx.luckysheet_select_save = [
                    {
                      row: [nextRow, nextRow],
                      column: [col, col],
                      row_focus: nextRow,
                      column_focus: col,
                    },
                  ];
                }
              }
            });
          }
          e.preventDefault();
        }
        // Let all other keys bubble up to cell input
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {list.map((v, i) => (
        <div
          className={`dropdown-List-item${i === activeIndex ? " active" : ""}`}
          key={i}
          onClick={() => {
            setContext((ctx) => {
              const arr = isMul ? selected.slice() : [];
              const index = arr.indexOf(v);
              if (index < 0) {
                arr.push(v);
              } else {
                arr.splice(index, 1);
              }
              setSelected(arr);
              setDropcownValue(ctx, v, arr);
              // Close dropdown and exit edit mode after selection
              if (!isMul) {
                ctx.dataVerificationDropDownList = false;
                ctx.luckysheetCellUpdate = [];
              }
            });
          }}
          tabIndex={0}
          style={i === activeIndex ? { background: "#e6f7ff" } : {}}
          onMouseEnter={() => setActiveIndex(i)}
        >
          <SVGIcon
            name="check"
            width={12}
            style={{
              verticalAlign: "middle",
              display: isMul && selected.indexOf(v) >= 0 ? "inline" : "none",
            }}
          />
          {v}
        </div>
      ))}
    </div>
  );
};
export default DropDownList;
