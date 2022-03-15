import { defaultSettings, Settings } from "@fortune-sheet/core/src/settings";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import "./index.css";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";
import produce from "immer";
import _, { assign } from "lodash";
import {
  CellWithRowAndCol,
  Sheet as SheetType,
} from "@fortune-sheet/core/src/types";
import Sheet from "../Sheet";
import WorkbookContext from "../../context";
import Toolbar from "../Toolbar";
import FxEditor from "../FxEditor";

const Workbook: React.FC<Settings> = (props) => {
  const [context, setContext] = useState(defaultContext());
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
        cellInputValue: React.createRef() as React.MutableRefObject<string>,
      },
    }),
    [context, mergedSettings, setContextValue]
  );
  useEffect(() => {
    setContext(
      produce((draftCtx) => {
        const sheet = mergedSettings.data?.[context.currentSheetIndex];
        if (!sheet) return;
        const cellData = sheet.celldata;
        let { data } = sheet;
        if (_.isEmpty(data) && !_.isEmpty(cellData)) {
          const lastRow = _.maxBy<CellWithRowAndCol>(cellData, "r");
          const lastCol = _.maxBy(cellData, "c");
          if (lastRow && lastCol) {
            const expandedData: SheetType["data"] = _.times(lastRow.r + 1, () =>
              _.times(lastCol.c + 1, () => null)
            );
            cellData?.forEach((d) => {
              // TODO setCellValue(expandedData, d.r, d.c, d.v);
              expandedData[d.r][d.c] = d.v;
            });
            draftCtx.luckysheetfile = produce(
              mergedSettings.data,
              (draftData) => {
                draftData[context.currentSheetIndex].data = expandedData;
              }
            );
            data = expandedData;
          }
        } else {
          draftCtx.luckysheetfile = mergedSettings.data;
        }

        draftCtx.luckysheet_select_save = sheet.luckysheet_select_save;
        if (draftCtx.luckysheet_select_save?.length === 0) {
          if (data?.[0]?.[0]?.mc) {
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
          draftCtx.defaultrowlen = parseFloat(sheet.defaultRowHeight);
        } else {
          draftCtx.defaultrowlen = mergedSettings.defaultRowHeight;
        }

        if (!_.isNil(sheet.defaultColWidth)) {
          draftCtx.defaultcollen = parseFloat(sheet.defaultColWidth);
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
  ]);

  if (!context.luckysheetfile) {
    return null;
  }

  return (
    <WorkbookContext.Provider value={providerValue}>
      <div className="fortune-container">
        <div className="fortune-workarea">
          <Toolbar />
          <FxEditor />
        </div>
        <Sheet
          data={context.luckysheetfile[context.calculateSheetIndex]?.data}
        />
      </div>
    </WorkbookContext.Provider>
  );
};

export default Workbook;
