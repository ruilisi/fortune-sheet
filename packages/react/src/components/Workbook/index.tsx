import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import "./index.css";
import defaultContext, {
  Context,
  getFlowdata,
  initSheetIndex,
} from "@fortune-sheet/core/src/context";
import produce from "immer";
import _, { assign } from "lodash";
import {
  CellWithRowAndCol,
  Sheet as SheetType,
} from "@fortune-sheet/core/src/types";
import { handleGlobalKeyDown } from "@fortune-sheet/core/src/events/keyboard";
import { getSheetIndex } from "@fortune-sheet/core/src/utils";
import { handlePaste } from "@fortune-sheet/core/src/events/paste";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";
import SheetTab from "../SheetTab";

const Workbook: React.FC<Settings> = (props) => {
  const [context, setContext] = useState(defaultContext());
  const cellInput = useRef<HTMLDivElement>(null);
  const fxInput = useRef<HTMLDivElement>(null);
  const scrollbarX = useRef<HTMLDivElement>(null);
  const scrollbarY = useRef<HTMLDivElement>(null);
  const cellArea = useRef<HTMLDivElement>(null);
  const globalCache = useRef<any>({});
  const mergedSettings = useMemo(() => assign(defaultSettings, props), [props]);
  const setContextValue = useCallback(
    <K extends keyof Context>(key: K, value: Context[K]) => {
      setContext(
        produce((draftCtx) => {
          draftCtx[key] = value;
        })
      );
    },
    []
  );
  const providerValue = useMemo(
    () => ({
      context,
      setContext,
      setContextValue,
      settings: mergedSettings,
      refs: {
        globalCache: globalCache.current,
        cellInput,
        fxInput,
        scrollbarX,
        scrollbarY,
        cellArea,
      },
    }),
    [context, mergedSettings, setContextValue]
  );

  useEffect(() => {
    setContext(
      produce((draftCtx) => {
        draftCtx.luckysheetfile = mergedSettings.data;
        draftCtx.defaultcolumnNum = mergedSettings.column;
        draftCtx.defaultrowNum = mergedSettings.row;
        draftCtx.defaultFontSize = mergedSettings.defaultFontSize;
        draftCtx.fullscreenmode = mergedSettings.fullscreenmode;
        draftCtx.lang = mergedSettings.lang;
        draftCtx.allowEdit = mergedSettings.allowEdit;
        draftCtx.limitSheetNameLength = mergedSettings.limitSheetNameLength;
        draftCtx.defaultSheetNameMaxLength =
          mergedSettings.defaultSheetNameMaxLength;
        // draftCtx.fontList = mergedSettings.fontList;
        if (_.isEmpty(draftCtx.currentSheetIndex)) {
          initSheetIndex(draftCtx);
        }
        const sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetIndex);
        if (_.isNil(sheetIdx)) return;

        const sheet = mergedSettings.data?.[sheetIdx];
        if (!sheet) return;

        const cellData = sheet.celldata;
        let { data } = sheet;
        // expand cell data
        if (_.isEmpty(data) && !_.isEmpty(cellData)) {
          const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
          const lastCol = _.maxBy(cellData, "c");
          if (lastRow && lastCol) {
            const expandedData: SheetType["data"] = _.times(lastRow.r + 1, () =>
              _.times(lastCol.c + 1, () => null)
            );
            cellData?.forEach((d) => {
              // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
              expandedData[d.r][d.c] = d.v;
            });
            draftCtx.luckysheetfile = produce(
              mergedSettings.data,
              (draftData) => {
                draftData[sheetIdx].data = expandedData;
              }
            );
            data = expandedData;
          }
        } else {
          draftCtx.luckysheetfile = mergedSettings.data;
        }

        draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
        if (draftCtx.luckysheet_select_save?.length === 0) {
          if (
            data?.[0]?.[0]?.mc &&
            !_.isNil(data?.[0]?.[0]?.mc?.rs) &&
            !_.isNil(data?.[0]?.[0]?.mc?.cs)
          ) {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, data[0][0].mc.rs - 1],
                column: [0, data[0][0].mc.cs - 1],
              },
            ];
          } else {
            draftCtx.luckysheet_select_save = [
              {
                row: [0, 0],
                column: [0, 0],
              },
            ];
          }
        }

        draftCtx.luckysheet_selection_range = _.isNil(
          sheet.luckysheet_selection_range
        )
          ? []
          : sheet.luckysheet_selection_range;
        draftCtx.config = _.isNil(sheet.config) ? {} : sheet.config;

        draftCtx.zoomRatio = _.isNil(sheet.zoomRatio) ? 1 : sheet.zoomRatio;

        if (!_.isNil(sheet.defaultRowHeight)) {
          draftCtx.defaultrowlen = Number(sheet.defaultRowHeight);
        } else {
          draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
        }

        if (!_.isNil(sheet.defaultColWidth)) {
          draftCtx.defaultcollen = Number(sheet.defaultColWidth);
        } else {
          draftCtx.defaultcollen = mergedSettings.defaultColWidth;
        }

        if (!_.isNil(sheet.showGridLines)) {
          const { showGridLines } = sheet;
          if (showGridLines === 0 || showGridLines === false) {
            draftCtx.showGridLines = false;
          } else {
            draftCtx.showGridLines = true;
          }
        } else {
          draftCtx.showGridLines = true;
        }
      })
    );
  }, [
    mergedSettings.data,
    context.currentSheetIndex,
    mergedSettings.defaultRowHeight,
    mergedSettings.defaultColWidth,
    mergedSettings.column,
    mergedSettings.row,
    mergedSettings.defaultFontSize,
    mergedSettings.fullscreenmode,
    mergedSettings.lang,
    mergedSettings.allowEdit,
    mergedSettings.limitSheetNameLength,
    mergedSettings.defaultSheetNameMaxLength,
  ]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      setContext(
        produce((draftCtx) => {
          handleGlobalKeyDown(
            draftCtx,
            providerValue.refs.cellInput.current!,
            providerValue.refs.fxInput.current!,
            e.nativeEvent
          );
        })
      );
    },
    [providerValue.refs.cellInput, providerValue.refs.fxInput]
  );

  const onPaste = useCallback((e: ClipboardEvent) => {
    setContext(
      produce((draftCtx) => {
        handlePaste(draftCtx, e);
      })
    );
  }, []);

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
    };
  }, [onPaste]);

  if (!context.luckysheetfile) {
    return null;
  }

  const sheetData = getFlowdata(context);
  if (!sheetData) {
    return null;
  }

  return (
    <WorkbookContext.Provider value={providerValue}>
      <div className="fortune-container" onKeyDown={onKeyDown}>
        <div className="fortune-workarea">
          <Toolbar />
          <FxEditor />
        </div>
        <Sheet data={sheetData} />
        <SheetTab />
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
