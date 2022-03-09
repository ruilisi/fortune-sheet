import React, { useRef, useEffect } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import { ContextManager } from "@fortune-sheet/core/src/context";

type Props = {
  ctxManager: ContextManager;
  data: any;
};

const Sheet: React.FC<Props> = ({ ctxManager, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    ctxManager.updateWithSheet(data);
    ctxManager.updateWithCanvas(canvasRef.current!);

    const tableCanvas = new Canvas(canvasRef.current!, ctxManager.ctx);
    tableCanvas.drawMain({
      scrollHeight: 0,
      scrollWidth: 0,
      offsetLeft: 0,
      offsetTop: 0,
    });
  }, [data]);

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
