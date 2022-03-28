import React, { useRef, useEffect, useContext, useCallback } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import {
  updateContextWithCanvas,
  updateContextWithSheetData,
} from "@fortune-sheet/core/src/context";
import type { CellMatrix } from "@fortune-sheet/core/src/types";
import {
  groupValuesRefresh,
  hasGroupValuesRefreshData,
} from "@fortune-sheet/core/src/modules/formula";
import produce from "immer";
import { handleGlobalWheel } from "@fortune-sheet/core/src/events/mouse";
import WorkbookContext from "../../context";
import SheetOverlay from "../SheetOverlay";

type Props = {
  data: CellMatrix;
};

const Sheet: React.FC<Props> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, refs } = useContext(WorkbookContext);

  useEffect(() => {
    setContext((ctx) => updateContextWithSheetData(ctx, data));
  }, [context.config?.rowlen, context.config?.columnlen, data, setContext]);

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
    (e: WheelEvent) => {
      setContext(
        produce((draftCtx) => {
          handleGlobalWheel(
            draftCtx,
            e,
            refs.globalCache,
            refs.scrollbarX.current!,
            refs.scrollbarY.current!
          );
        })
      );
    },
    [refs.scrollbarX, refs.scrollbarY, setContext]
  );

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener("wheel", onWheel);
    return () => {
      container?.removeEventListener("wheel", onWheel);
    };
  }, [onWheel]);

  return (
    <div ref={containerRef} className="fortune-sheet-container">
      <canvas className="fortune-sheet-canvas" ref={canvasRef} />
      <SheetOverlay />
    </div>
  );
};

export default Sheet;
