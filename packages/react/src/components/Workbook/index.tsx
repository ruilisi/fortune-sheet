import {
  defaultContext,
  defaultSettings,
  Settings,
  Context,
  getFlowdata,
  initSheetIndex,
  CellWithRowAndCol,
  GlobalCache,
  Sheet as SheetType,
  handleGlobalKeyDown,
  getSheetIndex,
  handlePaste,
} from "@fortune-sheet/core";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import "./index.css";
import produce from "immer";
import _, { assign } from "lodash";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";
import SheetTab from "../SheetTab";
import ContextMenu from "../ContextMenu";
import SVGDefines from "../SVGDefines";

const Workbook: React.FC<
  Settings & { onChange: (data: SheetType[]) => void }
> = ({ onChange, ...props }) => {
  const [context, setContext] = useState(defaultContext());
  const cellInput = useRef<HTMLDivElement>(null);
  const fxInput = useRef<HTMLDivElement>(null);
  const scrollbarX = useRef<HTMLDivElement>(null);
  const scrollbarY = useRef<HTMLDivElement>(null);
  const cellArea = useRef<HTMLDivElement>(null);
  const workbookContainer = useRef<HTMLDivElement>(null);
  const globalCache = useRef<GlobalCache>({});
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
        workbookContainer,
      },
    }),
    [context, mergedSettings, setContextValue]
  );

  useEffect(() => {
    onChange?.(context.luckysheetfile);
  }, [context.luckysheetfile, onChange]);

  useEffect(() => {
    setContext(
      produce((draftCtx) => {
        if (_.isEmpty(draftCtx.luckysheetfile)) {
          draftCtx.luckysheetfile = mergedSettings.data;
        }
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
        let sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetIndex);
        if (sheetIdx == null) {
          if ((draftCtx.luckysheetfile?.length ?? 0) > 0) {
            sheetIdx = 0;
            draftCtx.currentSheetIndex = draftCtx.luckysheetfile[0].index;
          }
        }
        if (sheetIdx == null) return;

        const sheet = draftCtx.luckysheetfile?.[sheetIdx];
        if (!sheet) return;

        const cellData = sheet.celldata;
        let { data } = sheet;
        // expand cell data
        if (_.isEmpty(data)) {
          const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
          const lastCol = _.maxBy(cellData, "c");
          const lastRowNum = lastRow?.r || draftCtx.defaultrowNum;
          const lastColNum = lastCol?.c || draftCtx.defaultcolumnNum;
          if (lastRowNum && lastColNum) {
            const expandedData: SheetType["data"] = _.times(
              lastRowNum + 1,
              () => _.times(lastColNum + 1, () => null)
            );
            cellData?.forEach((d) => {
              // TODO setCellValue(draftCtx, d.r, d.c, expandedData, d.v);
              expandedData[d.r][d.c] = d.v;
            });
            sheet.data = expandedData;
            data = expandedData;
          }
        }

        if (
          _.isEmpty(draftCtx.luckysheet_select_save) &&
          !_.isEmpty(sheet.luckysheet_select_save)
        ) {
          draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
        }
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
    context.luckysheetfile?.length,
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

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    setContext(
      produce((draftCtx) => {
        handleGlobalKeyDown(
          draftCtx,
          cellInput.current!,
          fxInput.current!,
          e.nativeEvent,
          globalCache.current!
        );
      })
    );
  }, []);

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
      <div
        className="fortune-container"
        ref={workbookContainer}
        onKeyDown={onKeyDown}
      >
        <SVGDefines />
        <div className="fortune-workarea">
          <Toolbar />
          <FxEditor />
        </div>
        <Sheet data={sheetData} />
        <SheetTab />
        <ContextMenu />
        {!_.isEmpty(context.contextMenu) && (
          <div
            onMouseDown={() => {
              setContextValue("contextMenu", undefined);
            }}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="fortune-popover-backdrop"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1003, // should below .fortune-context-menu
              height: "100%",
              width: "100%",
            }}
          />
        )}
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
