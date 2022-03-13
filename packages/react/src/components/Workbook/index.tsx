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
    () => ({ context, setContext, setContextValue, settings: mergedSettings }),
    [context, mergedSettings, setContextValue]
  );
  useEffect(() => {
    const cellData = mergedSettings.data?.[context.currentSheetIndex]?.celldata;
    const data = mergedSettings.data?.[context.currentSheetIndex]?.data;
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
        setContextValue(
          "luckysheetfile",
          produce(mergedSettings.data, (draftData) => {
            draftData[context.currentSheetIndex].data = expandedData;
          })
        );
      }
    } else {
      setContextValue("luckysheetfile", mergedSettings.data);
    }
  }, [mergedSettings.data, context.currentSheetIndex, setContextValue]);

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
