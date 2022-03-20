import React, { useRef, useEffect, useContext, useCallback } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import {
  updateContextWithCanvas,
  updateContextWithSheetData,
} from "@fortune-sheet/core/src/context";
import type { Sheet as SheetType } from "@fortune-sheet/core/src/types";
import {
  groupValuesRefresh,
  hasGroupValuesRefreshData,
} from "@fortune-sheet/core/src/modules/formula";
import produce from "immer";
import { handleGlobalWheel } from "@fortune-sheet/core/src/canvas";
import WorkbookContext from "../../context";
import SheetOverlay from "../SheetOverlay";

type Props = {
  data: SheetType["data"];
};

const Sheet: React.FC<Props> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { context, setContext, refs } = useContext(WorkbookContext);

  useEffect(() => {
    setContext((ctx) => updateContextWithSheetData(ctx, data));
  }, [data, setContext]);

  useEffect(() => {
    setContext((ctx) => updateContextWithCanvas(ctx, canvasRef.current!));
  }, [setContext]);

  useEffect(() => {
    if (hasGroupValuesRefreshData()) {
      setContext(
        produce((draftCtx) => {
          groupValuesRefresh(draftCtx);
        })
      );
    }
  }, [context.luckysheetfile, context.currentSheetIndex, setContext]);

  useEffect(() => {
    const tableCanvas = new Canvas(canvasRef.current!, context);
    tableCanvas.drawMain({
      scrollHeight: context.scrollTop,
      scrollWidth: context.scrollLeft,
    });
    tableCanvas.drawColumnHeader(context.scrollLeft);
    tableCanvas.drawRowHeader(context.scrollTop);
  }, [context]);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      setContext(
        produce((draftCtx) => {
          handleGlobalWheel(draftCtx, e.nativeEvent);
        })
      );
    },
    [setContext]
  );

  return (
    <div className="fortune-sheet-container" onWheel={onWheel}>
      <canvas className="fortune-sheet-canvas" ref={canvasRef} />
      <SheetOverlay data={data} />
    </div>
  );
};

export default Sheet;
