import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  getFlowdata,
  setCellValue,
  jfrefreshgrid,
  getSheetIndex,
} from "@fortune-sheet/core";
import WorkbookContext from "../../context";

const AutocompleteList: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Get unique values from current column
  const getColumnValues = useCallback((): string[] => {
    const flowdata = getFlowdata(context);
    if (!flowdata) return [];

    const selection = context.luckysheet_select_save?.[0];
    if (!selection) return [];

    const col_index = selection.column_focus;
    if (col_index == null) return [];

    const values = new Set<string>();

    // Collect all non-empty values from the column
    for (let r = 0; r < flowdata.length; r += 1) {
      const cell = flowdata[r]?.[col_index];
      if (cell && cell.v != null && cell.v !== "") {
        const value = String(cell.v).trim();
        if (value) {
          values.add(value);
        }
      }
    }

    return Array.from(values).sort();
  }, [context]);

  // Select suggestion function
  const selectSuggestion = useCallback(
    (value: string) => {
      setContext((ctx) => {
        const selection = ctx.luckysheet_select_save?.[0];
        if (!selection) return;

        const row_index = selection.row_focus ?? selection.row[0];
        const col_index = selection.column_focus ?? selection.column[0];

        if (row_index == null || col_index == null) return;

        const flowdata = getFlowdata(ctx);
        if (!flowdata) return;

        // Set cell value
        setCellValue(ctx, row_index, col_index, flowdata, value);

        // Refresh grid
        jfrefreshgrid(ctx, null, undefined);

        // Close autocomplete and exit edit mode
        ctx.luckysheetCellUpdate = [];
      });

      setSuggestions([]);
    },
    [setContext]
  );

  // Monitor cell input changes
  useEffect(() => {
    const input = document.getElementById("luckysheet-rich-text-editor");
    if (!input) return undefined;

    const observer = new MutationObserver(() => {
      // Check if current cell has data verification
      const selection = context.luckysheet_select_save?.[0];
      if (selection) {
        const row_index = selection.row_focus ?? selection.row[0];
        const col_index = selection.column_focus ?? selection.column[0];

        if (row_index != null && col_index != null) {
          const sheetIndex = getSheetIndex(context, context.currentSheetId);
          if (sheetIndex != null) {
            const { dataVerification } = context.luckysheetfile[sheetIndex];
            if (
              dataVerification &&
              dataVerification[`${row_index}_${col_index}`]
            ) {
              // Don't show autocomplete for cells with data verification
              setSuggestions([]);
              return;
            }
          }
        }
      }

      const text = input.textContent || "";

      if (text.trim()) {
        const columnValues = getColumnValues();
        const filtered = columnValues.filter(
          (value) =>
            value.toLowerCase().startsWith(text.toLowerCase()) &&
            value.toLowerCase() !== text.toLowerCase() && // Don't show if exact match
            !/^\d/.test(value) // Don't show if value starts with a number
        );
        setSuggestions(filtered);
        setActiveIndex(0);
      } else {
        setSuggestions([]);
      }
    });

    observer.observe(input, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getColumnValues]);

  // Handle keyboard navigation
  useEffect(() => {
    if (suggestions.length === 0) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev === 0 ? suggestions.length - 1 : prev - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        if (suggestions.length > 0) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setSuggestions([]);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [suggestions, activeIndex, selectSuggestion]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      ) as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  if (suggestions.length === 0) return null;

  const selection = context.luckysheet_select_save?.[0];
  if (!selection) return null;

  const col_index = selection.column_focus;
  if (col_index == null) return null;

  const row_index = selection.row_focus ?? selection.row[0];
  if (row_index == null) return null;

  // Don't show autocomplete if cell has data verification
  const sheetIndex = getSheetIndex(context, context.currentSheetId);
  if (sheetIndex != null) {
    const { dataVerification } = context.luckysheetfile[sheetIndex];
    if (dataVerification && dataVerification[`${row_index}_${col_index}`]) {
      return null;
    }
  }

  const col = context.visibledatacolumn[col_index];
  const col_pre =
    col_index === 0 ? 0 : context.visibledatacolumn[col_index - 1];
  const row = context.visibledatarow[row_index];

  return (
    <div
      ref={listRef}
      style={{
        position: "absolute",
        left: col_pre,
        top: row,
        width: col - col_pre,
        maxHeight: 200,
        overflowY: "auto",
        backgroundColor: "white",
        border: "1px solid #ccc",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1001,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion}
          data-index={index}
          onClick={() => selectSuggestion(suggestion)}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            backgroundColor: index === activeIndex ? "#e6f7ff" : "white",
            borderBottom: "1px solid #f0f0f0",
          }}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};

export default AutocompleteList;
