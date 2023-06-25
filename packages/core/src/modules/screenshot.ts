import { Canvas } from "../canvas";
import { Context } from "../context";
// import { locale } from "../locale";
import { hasPartMC } from "./validation";

export function handleScreenShot(ctx: Context) {
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

  const st_r = ctx.luckysheet_select_save[0].row[0];
  const ed_r = ctx.luckysheet_select_save[0].row[1];
  const st_c = ctx.luckysheet_select_save[0].column[0];
  const ed_c = ctx.luckysheet_select_save[0].column[1];

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

  newCanvas.drawMain({
    scrollWidth,
    scrollHeight,
    drawWidth: ch_width,
    drawHeight: rh_height,
    offsetLeft: 1,
    offsetTop: 1,
    clear: true,
  });
  const ctx_newCanvas = newCanvasElement.getContext("2d");
  if (ctx_newCanvas == null) return undefined;

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
