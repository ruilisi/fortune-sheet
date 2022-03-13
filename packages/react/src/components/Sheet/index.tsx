import React, { useRef, useEffect, useContext } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import {
  updateContextWithCanvas,
  updateContextWithSheetData,
} from "@fortune-sheet/core/src/context";
import type { Sheet as SheetType } from "@fortune-sheet/core/src/types";
import WorkbookContext from "../../context";
import SheetOverlay from "../SheetOverlay";

type Props = {
  data: SheetType["data"];
};

const Sheet: React.FC<Props> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { context, setContext } = useContext(WorkbookContext);

  useEffect(() => {
    setContext((ctx) => updateContextWithSheetData(ctx, data));
  }, [data, setContext]);

  useEffect(() => {
    setContext((ctx) => updateContextWithCanvas(ctx, canvasRef.current!));
  }, [setContext]);

  useEffect(() => {
    const tableCanvas = new Canvas(canvasRef.current!, context);
    tableCanvas.drawMain({
      scrollHeight: 0,
      scrollWidth: 0,
    });
    tableCanvas.drawColumnHeader(0);
    tableCanvas.drawRowHeader(0);
  }, [context]);

  return (
    <div className="fortune-sheet-container">
      <canvas className="fortune-sheet-canvas" ref={canvasRef} />
      <SheetOverlay data={data} />
    </div>
  );
};

export default Sheet;
