import React, { useRef, useEffect } from "react";
import { Canvas, Context } from "@fortune-sheet/core/src";

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
    ctx.visibledatarow = [100];
    ctx.visibledatacolumn = [100];

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
      ch_width: 2073,
      rh_height: 936,
      cellmainWidth: 1157,
      cellmainHeight: 692,
      toolbarHeight: 41,
      infobarHeight: 57,
      calculatebarHeight: 29,
      rowHeaderWidth: 46,
      columnHeaderHeight: 20,
      cellMainSrollBarSize: 12,
      sheetBarHeight: 31,
      statisticBarHeight: 23,
      luckysheetTableContentHW: [1191, 700],
    };

    const tableCanvas = new Canvas(canvasRef.current!, ctx);
    tableCanvas.drawMain({
      scrollHeight: 0,
      scrollWidth: 0,
      offsetLeft: 0,
      offsetTop: 0,
    });
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: 1191, height: 700 }}
        width={2382}
        height={1400}
      />
    </div>
  );
};

export default Workbook;
