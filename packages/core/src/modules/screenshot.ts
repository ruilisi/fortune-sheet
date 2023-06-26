import { Canvas, defaultStyle } from "../canvas";
import { Context } from "../context";
// import { locale } from "../locale";
import { hasPartMC } from "./validation";

interface ScreenHotOptions {
  noDefaultBorder?: boolean;
  imageLayer?: boolean;
  range?: {
    row: [number, number];
    column: [number, number];
  };
}

function setDefaultColor(empty: boolean) {
  if (!empty) {
    return () => {};
  }
  const defaultStrokeStyle = defaultStyle.strokeStyle;
  defaultStyle.strokeStyle = "#ffffff";
  return () => {
    defaultStyle.strokeStyle = defaultStrokeStyle;
  };
}

async function drawImages(
  context: Context,
  {
    canvasCtx,
    scrollWidth,
    scrollHeight,
    drawWidth,
    drawHeight,
    offsetLeft,
    offsetTop,
  }: {
    canvasCtx: CanvasRenderingContext2D;
    scrollWidth: number;
    scrollHeight: number;
    drawWidth: number;
    drawHeight: number;
    offsetLeft: number;
    offsetTop: number;
  }
) {
  // 读取上下文中的图片
  // 判断是否相交
  const images = context.insertedImgs ?? [];
  const rect = {
    left: scrollWidth,
    top: scrollHeight,
    right: scrollWidth + drawWidth,
    bottom: scrollHeight + drawHeight,
  };

  canvasCtx.save();
  canvasCtx.scale(context.devicePixelRatio, context.devicePixelRatio);
  canvasCtx.translate(-scrollWidth + offsetLeft, -scrollHeight + offsetTop);
  function pointInRect(point: { x: number; y: number }) {
    const { x, y } = point;
    if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
      return true;
    }
    return false;
  }
  async function drawImage(imageOrigin: HTMLImageElement) {
    const { left, top, width, height, src } = imageOrigin as any;

    const imageEle = await new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.src = src;

      image.onload = function onload() {
        resolve(image);
      };
      image.onerror = function onload() {
        resolve(image);
      };
    });
    canvasCtx.drawImage(imageEle, left, top, width, height);
  }
  await Promise.all(
    images.map(async (image): Promise<void> => {
      const { left, top, width, height } = image as any;
      // 判断矩形相交
      const points = [
        // 左上
        { x: left, y: top },
        // 右上
        { x: left + width, y: top },
        // 左下
        { x: left, y: top + height },
        // 右下
        { x: left + width, y: top + height },
      ];
      if (points.some((v) => pointInRect(v))) {
        // 判断与画布相交
        await drawImage(image as any);
      }
    })
  );

  canvasCtx.restore();
}

export async function handleScreenShot(
  ctx: Context,
  options?: ScreenHotOptions
) {
  // const { screenshot } = locale;
  if (ctx.luckysheet_select_save == null) return undefined;
  if (ctx.luckysheet_select_save.length === 0) {
    // if (isEditMode()) {
    //   alert(locale_screenshot.screenshotTipNoSelection);
    // } else {
    //   tooltip.info(
    //     locale_screenshot.screenshotTipTitle,
    //     locale_screenshot.screenshotTipNoSelection
    //   );
    // }
    return undefined;
  }

  if (ctx.luckysheet_select_save.length > 1) {
    // if (isEditMode()) {
    //   alert(locale_screenshot.screenshotTipHasMulti);
    // } else {
    //   tooltip.info(
    //     locale_screenshot.screenshotTipTitle,
    //     locale_screenshot.screenshotTipHasMulti
    //   );
    // }

    return undefined;
  }

  // 截图范围内包含部分合并单元格，提示
  if (ctx.config.merge != null) {
    let has_PartMC = false;

    for (let s = 0; s < ctx.luckysheet_select_save.length; s += 1) {
      const r1 = ctx.luckysheet_select_save[s].row[0];
      const r2 = ctx.luckysheet_select_save[s].row[1];
      const c1 = ctx.luckysheet_select_save[s].column[0];
      const c2 = ctx.luckysheet_select_save[s].column[1];

      has_PartMC = hasPartMC(ctx, ctx.config, r1, r2, c1, c2);

      if (has_PartMC) {
        break;
      }
    }

    if (has_PartMC) {
      // if (isEditMode()) {
      //   alert(locale_screenshot.screenshotTipHasMerge);
      // } else {
      //   tooltip.info(
      //     locale_screenshot.screenshotTipTitle,
      //     locale_screenshot.screenshotTipHasMerge
      //   );
      // }
      return undefined;
    }
  }

  const [st_r, ed_r] = options?.range?.row ?? ctx.luckysheet_select_save[0].row;
  const [st_c, ed_c] =
    options?.range?.column ?? ctx.luckysheet_select_save[0].column;

  // max line width = 3;
  let scrollHeight;
  let rh_height;
  if (st_r - 1 < 0) {
    scrollHeight = -1.5;
    rh_height = ctx.visibledatarow[ed_r] + 1.5;
  } else {
    scrollHeight = ctx.visibledatarow[st_r - 1] - 1.5;
    rh_height = ctx.visibledatarow[ed_r] - ctx.visibledatarow[st_r - 1] + 1.5;
  }

  let scrollWidth;
  let ch_width;
  if (st_c - 1 < 0) {
    scrollWidth = -1.5;
    ch_width = ctx.visibledatacolumn[ed_c] + 1.5;
  } else {
    scrollWidth = ctx.visibledatacolumn[st_c - 1] - 1.5;
    ch_width =
      ctx.visibledatacolumn[ed_c] - ctx.visibledatacolumn[st_c - 1] + 1.5;
  }
  const newCanvasElement = document.createElement("canvas");
  newCanvasElement.width = Math.ceil(ch_width * devicePixelRatio);
  newCanvasElement.height = Math.ceil(rh_height * devicePixelRatio);
  newCanvasElement.style.width = `${ch_width}px`;
  newCanvasElement.style.height = `${rh_height}px`;
  const newCanvas = new Canvas(newCanvasElement, ctx);
  const revertColor = setDefaultColor(options?.noDefaultBorder ?? false);
  newCanvas.drawMain({
    scrollWidth,
    scrollHeight,
    drawWidth: ch_width,
    drawHeight: rh_height,
    offsetLeft: 1,
    offsetTop: 1,
    clear: true,
  });
  revertColor();
  const ctx_newCanvas = newCanvasElement.getContext("2d");
  if (ctx_newCanvas == null) return undefined;
  await drawImages(ctx, {
    canvasCtx: ctx_newCanvas,
    scrollWidth,
    scrollHeight,
    drawWidth: ch_width,
    drawHeight: rh_height,
    offsetLeft: 0,
    offsetTop: 0,
  });

  const image = new Image();
  const url = newCanvasElement.toDataURL("image/png");
  image.src = url;

  if (ch_width > rh_height) {
    image.style.width = "100%";
  } else {
    image.style.height = "100%";
  }

  newCanvasElement.remove();
  return image.src;
}
