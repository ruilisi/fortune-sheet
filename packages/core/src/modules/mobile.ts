import { Context } from "..";
import { GlobalCache } from "../types";

// export default function mobileinit(ctx: Context) {
//   ctx.cellMainSrollBarSize = 0;
//   // let luckysheet_touchmove_status = false;
//   // let luckysheet_touchmove_startPos = {};
//   // const luckysheet_touchhandle_status = false;
// }

export function handleOverlayTouchStart(
  ctx: Context,
  e: TouchEvent,
  globalCache: GlobalCache
) {
  globalCache.touchMoveStatus = true;
  const touch = e.targetTouches[0];
  globalCache.touchMoveStartPos = {
    x: touch.pageX,
    y: touch.pageY,
    vy: 0,
    moveType: "y",
  };
}

export function handleOverlayTouchMove(
  ctx: Context,
  e: TouchEvent,
  globalCache: GlobalCache,
  scrollbarX: HTMLDivElement,
  scrollbarY: HTMLDivElement
) {
  if (e.targetTouches.length > 1) return;
  const touch = e.targetTouches[0];
  if (globalCache.touchMoveStatus) {
    if (!globalCache.touchMoveStartPos) return;
    const slideX = touch.pageX - globalCache.touchMoveStartPos.x;
    const slideY = touch.pageY - globalCache.touchMoveStartPos.y;
    let { scrollLeft } = ctx;
    let { scrollTop } = ctx;
    scrollLeft -= slideX;
    scrollTop -= slideY;
    scrollbarY.scrollTop = scrollTop;

    globalCache.touchMoveStartPos.vy_y = slideY;
    globalCache.touchMoveStartPos.scrollTop = scrollTop;

    scrollbarX.scrollLeft = scrollLeft;

    globalCache.touchMoveStartPos.vy_x = slideX;
    globalCache.touchMoveStartPos.scrollLeft = scrollLeft;
  }
}

export function handleOverlayTouchEnd(globalCache: GlobalCache) {
  globalCache.touchMoveStatus = false;
  globalCache.touchHandleStatus = false;
}
