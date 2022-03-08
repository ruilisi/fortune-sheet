import React, { useRef, useEffect } from "react";
import { Canvas, Context } from "@fortune-sheet/core/src";
import "./index.css";

const Workbook: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let ctx = Context();
    ctx.flowdata = [];
    for (let i = 0; i < 100; i += 1) {
      ctx.flowdata.push([]);
      for (let j = 0; j < 100; j += 1) {
        if ((j + i) % 2 === 0) {
          ctx.flowdata[i].push(null);
        } else {
          ctx.flowdata[i].push({
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

    ctx = {
      ...ctx,
      visibledatarow: [
        21, 42, 63, 84, 105, 126, 147, 168, 189, 210, 231, 252, 273, 294, 315,
        336, 357, 389, 410, 431, 452, 473, 494, 515, 536, 616, 637, 658, 739,
        776, 776, 776, 796, 816, 836, 856,
      ],
      visibledatacolumn: [
        132, 206, 360, 489, 626, 749, 888, 1020, 1149, 1290, 1435, 1509, 1583,
        1657, 1731, 1805, 1879, 1953,
      ],
      toolbarHeight: 41,
      infobarHeight: 57,
      calculatebarHeight: 29,
      rowHeaderWidth: 46,
      columnHeaderHeight: 20,
      cellMainSrollBarSize: 12,
      sheetBarHeight: 31,
      statisticBarHeight: 23,
    };

    const canvas = canvasRef.current!;

    ctx.luckysheetTableContentHW = [canvas.clientWidth, canvas.clientHeight];

    canvas.style.width = `${ctx.luckysheetTableContentHW[0]}px`;
    canvas.style.height = `${ctx.luckysheetTableContentHW[1]}px`;
    canvas.width = Math.ceil(
      ctx.luckysheetTableContentHW[0] * ctx.devicePixelRatio
    );
    canvas.height = Math.ceil(
      ctx.luckysheetTableContentHW[1] * ctx.devicePixelRatio
    );

    const tableCanvas = new Canvas(canvas, ctx);
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
