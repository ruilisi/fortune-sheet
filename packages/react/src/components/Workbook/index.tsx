import React, { useRef, useEffect } from "react";
import { Canvas } from "@fortune-sheet/core/src";
import "./index.css";
import { ContextManager } from "@fortune-sheet/core/src/context";

const Workbook: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctxManager = new ContextManager();
    const data: any = [];
    for (let i = 0; i < 100; i += 1) {
      data.push([]);
      for (let j = 0; j < 100; j += 1) {
        if ((j + i) % 2 === 0) {
          data[i].push(null);
        } else {
          data[i].push({
            ct: {
              fa: "General",
              t: "g",
            },
            m: "haha",
            v: "haha",
          });
        }
      }
    }

    ctxManager.updateWithSheet(data);
    ctxManager.updateWithCanvas(canvasRef.current!);

    const tableCanvas = new Canvas(canvasRef.current!, ctxManager.ctx);
    tableCanvas.drawMain({
      scrollHeight: 0,
      scrollWidth: 0,
      offsetLeft: 0,
      offsetTop: 0,
    });
  }, []);

  return (
    <div className="fortune-container">
      <div className="fortune-workarea">
        <div className="fortune-toolbar">toolbar</div>
        <div className="fortune-celldetail">celldetail</div>
      </div>
      <div className="fortune-sheet-container">
        <div className="fortune-row-header">rowheader</div>
        <div className="fortune-col-body">
          <div className="fortune-col-header">colheader</div>
          <canvas className="fortune-sheet-canvas" ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default Workbook;
