import React, { useRef, useEffect, useContext } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import {
  updateContextWithCanvas,
  updateContextWithSheetData,
} from "@fortune-sheet/core/src/context";
import WorkbookContext from "../../context";

type Props = {
  data: any;
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
      offsetLeft: 0,
      offsetTop: 0,
    });
  }, [context]);

  return (
    <div className="fortune-sheet-container">
      <div className="fortune-row-header">rowheader</div>
      <div className="fortune-col-body">
        <div className="fortune-col-header">colheader</div>
        <div className="fortune-sheet-area">
          <canvas className="fortune-sheet-canvas" ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default Sheet;
