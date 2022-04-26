import _ from "lodash";
import { CellMatrix, GlobalCache } from "../types";
import { getArrowCanvasSize, getCellTopRightPostion, mergeBorder } from ".";
import { Context, getFlowdata } from "../context";

type ImageProps = {
  defaultWidth: number;
  defaultHeight: number;
  currentObj: null;
  currentWinW: null;
  currentWinH: null;
  resize: null;
  resizeXY: null;
  move: boolean;
  moveXY: object | null;
  cursorStartPosition: { x: number; y: number } | null;
};

export const imageProps: ImageProps = {
  defaultWidth: 144,
  defaultHeight: 84,
  currentObj: null,
  currentWinW: null,
  currentWinH: null,
  resize: null,
  resizeXY: null,
  move: false,
  moveXY: null,
  cursorStartPosition: null,
};

export function getImageByRC(
  ctx: Context,
  flowdata: CellMatrix,
  r: number,
  c: number
) {
  const image = flowdata[r][c]?.ps;
  const { toX, toY } = getCellTopRightPostion(ctx, flowdata, r, c);
  // let scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  // let scrollTop = $("#luckysheet-cell-main").scrollTop();

  // if(luckysheetFreezen.freezenverticaldata != null && toX < (luckysheetFreezen.freezenverticaldata[0] - luckysheetFreezen.freezenverticaldata[2])){
  //     toX += scrollLeft;
  // }
  // if(luckysheetFreezen.freezenhorizontaldata != null && toY < (luckysheetFreezen.freezenhorizontaldata[0] - luckysheetFreezen.freezenhorizontaldata[2])){
  //     toY += scrollTop;
  // }
  const left =
    image?.left == null ? toX + 18 * ctx.zoomRatio : image.left * ctx.zoomRatio;
  let top =
    image?.top == null ? toY - 18 * ctx.zoomRatio : image.top * ctx.zoomRatio;
  const width =
    image?.width == null
      ? imageProps.defaultWidth * ctx.zoomRatio
      : image.width * ctx.zoomRatio;
  const height =
    image?.height == null
      ? imageProps.defaultHeight * ctx.zoomRatio
      : image.height * ctx.zoomRatio;
  const value = image?.value == null ? "" : image.value;

  if (top < 0) {
    top = 2;
  }
  const size = getArrowCanvasSize(left, top, toX, toY);
  const rc = `${r}_${c}`;
  return { r, c, rc, left, top, width, height, value, size, autoFocus: false };
}

export function generateRandomId(prefix: string) {
  if (prefix == null) {
    prefix = "img";
  }

  const userAgent = window.navigator.userAgent
    .replace(/[^a-zA-Z0-9]/g, "")
    .split("");

  let mid = "";

  for (let i = 0; i < 12; i += 1) {
    mid += userAgent[Math.round(Math.random() * (userAgent.length - 1))];
  }

  const time = new Date().getTime();

  return `${prefix}_${mid}_${time}`;
}

export function showImgChooser() {
  const chooser = document.getElementById(
    "luckysheet-imgUpload"
  ) as HTMLInputElement;
  if (chooser) chooser.click();
}

function _insertImg(src: any, ctx: Context, setContext: any) {
  try {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    let rowIndex = last?.row_focus;
    let colIndex = last?.column_focus;
    if (!last) {
      rowIndex = 0;
      colIndex = 0;
    } else {
      if (rowIndex == null) {
        [rowIndex] = last.row;
      }
      if (colIndex == null) {
        [colIndex] = last.column;
      }
    }
    const flowdata = getFlowdata(ctx);
    let left = colIndex === 0 ? 0 : ctx.visibledatacolumn[colIndex - 1];
    let top = rowIndex === 0 ? 0 : ctx.visibledatarow[rowIndex - 1];
    if (flowdata) {
      const margeset = mergeBorder(ctx, flowdata, rowIndex, colIndex);
      if (margeset) {
        [top] = margeset.row;
        [left] = margeset.column;
      }
    }
    const image = new Image();
    image.onload = () => {
      const { width } = image;
      const { height } = image;
      const img = {
        id: generateRandomId("img"),
        src,
        left,
        top,
        width: width * 0.5,
        height: height * 0.5,
        originWidth: width,
        originHeight: height,
      };
      setContext((draftCtx: Context) => {
        draftCtx.insertedImgs = (draftCtx.insertedImgs || []).concat(img);
      });
    };
    // addImgItem(img);
    // };
    // const imageUrlHandle =
    //   Store.toJsonOptions && Store.toJsonOptions.imageUrlHandle;
    // image.src = typeof imageUrlHandle === "function" ? imageUrlHandle(src) : src;
    image.src = src;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.info(err);
  }
}
// }

export function insertImage(setContext: any, file: any) {
  // const uploadImage = ctx.toJsonOptions && Store.toJsonOptions.uploadImage;
  // if (typeof uploadImage === "function") {
  //   // 上传形式
  //   uploadImage(file)
  //     .then((url) => {
  //       imageCtrl._insertImg(url);
  //     })
  //     .catch((error) => {
  //       tooltip.info(
  //         '<i class="fa fa-exclamation-triangle"></i>',
  //         "图片上传失败"
  //       );
  //     });
  // } else {
  // 内部base64形式
  const render = new FileReader();
  render.readAsDataURL(file);

  render.onload = (event) => {
    if (event.target == null) return;
    const src = event.target?.result;

    setContext((ctx: Context) => {
      _insertImg(src, ctx, setContext);
    });
    // $("#luckysheet-imgUpload").val("");
  };
}

// function addImgItem(img: any, ctx: Context) {
//   let width;
//   let height;
//   const max = 400;

//   if (img.originHeight < img.originWidth) {
//     height = Math.round(img.originHeight * (max / img.originWidth));
//     width = max;
//   } else {
//     width = Math.round(img.originWidth * (max / img.originHeight));
//     height = max;
//   }
//   if (ctx.insertedImgs == null) {
//     ctx.insertedImgs = {};
//   }

// const imgItem = $.extend(true, {},  imgItem);
// imgItem.src = img.src;
// imgItem.originWidth = img.originWidth;
// imgItem.originHeight = img.originHeight;
// imgItem.default.width = width;
// imgItem.default.height = height;
// imgItem.default.left = img.left;
// imgItem.default.top = img.top;
// imgItem.crop.width = width;
// imgItem.crop.height = height;

// const scrollTop = $("#luckysheet-cell-main").scrollTop();
// const scrollLeft = $("#luckysheet-cell-main").scrollLeft();

// imgItem.fixedLeft = img.left - scrollLeft + ctx.rowHeaderWidth;
// imgItem.fixedTop =
//   img.top -
//   scrollTop +
//   ctx.infobarHeight +
//   ctx.toolbarHeight +
//   ctx.calculatebarHeight +
//   ctx.columnHeaderHeight;

// const id = generateRandomId();
// const modelHtml = _this.modelHtml(id, imgItem);

// $("#luckysheet-image-showBoxs .img-list").append(modelHtml);

// images[id] = imgItem;
//   ref();

//   init();
// }
function getImagePosition(ctx: Context, container: HTMLDivElement) {
  const box = document.getElementById("luckysheet-modal-dialog-activeImage");
  if (!box) return undefined;
  // eslint-disable-next-line prefer-const
  let { top, left, width, height } = box.getBoundingClientRect();
  const rect = container.getBoundingClientRect();
  left -= ctx.rowHeaderWidth + rect.left;
  top -= ctx.columnHeaderHeight + rect.top;
  return { left, top, width, height };
}
/*
export function getImgItemParam(imgItem) {
  // const { isFixedPos } = imgItem;

  const { width } = imgItem.default;
  const { height } = imgItem.default;
  const { left } = imgItem.default;
  const { top } = imgItem.default;

  // if (imgItem.crop.width !== width || imgItem.crop.height != height) {
  //   width = imgItem.crop.width;
  //   height = imgItem.crop.height;
  //   left += imgItem.crop.offsetLeft;
  //   top += imgItem.crop.offsetTop;
  // }

  // let position = "absolute";
  // if (isFixedPos) {
  //   position = "fixed";
  //   left = imgItem.fixedLeft + imgItem.crop.offsetLeft;
  //   top = imgItem.fixedTop + imgItem.crop.offsetTop;
  // }

  return {
    width,
    height,
    left,
    top,
    // position,
  };
}
*/
export function cancelActiveImgItem(ctx: Context, globalCache: GlobalCache) {
  ctx.activeImg = undefined;
  globalCache.image = undefined;
}
export function onImageMoveStart(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLDivElement
  // { r, c, rc }: { r: number; c: number; rc: string },
) {
  const position = getImagePosition(ctx, container);
  if (position) {
    const { top, left } = position;
    _.set(globalCache, "image", {
      cursorMoveStartPosition: {
        x: e.pageX,
        y: e.pageY,
      },
      // movingId,
      // imageRC: { r, c, rc },
      imgInitialPosition: { left, top },
    });
  }
}

export function onImageMove(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent
  // container: HTMLDivElement
) {
  const image = globalCache?.image;
  // const position = getImagePosition(ctx, container);
  const img = document.getElementById("luckysheet-modal-dialog-activeImage");
  if (img && image && !image.resizingSide) {
    const { x: startX, y: startY } = image.cursorMoveStartPosition!;
    let { top, left } = image.imgInitialPosition!;
    left += e.pageX - startX;
    top += e.pageY - startY;
    if (top < 0) top = 0;
    (img as HTMLDivElement).style.left = `${left}px`;
    (img as HTMLDivElement).style.top = `${top}px`;
    return true;
  }
  return false;
}

export function onImageMoveEnd(
  ctx: Context,
  globalCache: GlobalCache,
  container: HTMLDivElement
) {
  const position = getImagePosition(ctx, container);
  if (!globalCache.image?.resizingSide) {
    globalCache.image = undefined;

    if (position) {
      const img = _.find(ctx.insertedImgs, (v) => v.id === ctx.activeImg?.id);
      if (img) {
        img.left = position.left;
        img.top = position.top;
      }
    }
  }
}

export function onImageResizeStart(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLDivElement,
  resizingSide: string
) {
  const position = getImagePosition(ctx, container);
  if (position) {
    _.set(globalCache, "image", {
      cursorMoveStartPosition: { x: e.pageX, y: e.pageY },
      resizingSide,
      imgInitialPosition: position,
    });
  }
}

export function onImageResize(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent
) {
  const image = globalCache?.image;
  if (image?.resizingSide) {
    const imgContainer = document.getElementById(
      "luckysheet-modal-dialog-activeImage"
    );
    const img = imgContainer?.querySelector(".luckysheet-modal-dialog-content");
    if (img == null) return false;
    const { x: startX, y: startY } = image.cursorMoveStartPosition!;
    let { top, left, width, height } = image.imgInitialPosition!;
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;
    const minHeight = 60 * ctx.zoomRatio;
    const minWidth = 1.5 * 60 * ctx.zoomRatio;
    if (["lm", "lt", "lb"].includes(image.resizingSide)) {
      if (width - dx < minWidth) {
        left += width - minWidth;
        width = minWidth;
      } else {
        left += dx;
        width -= dx;
      }
      if (left < 0) left = 0;
      (img as HTMLDivElement).style.left = `${left}px`;
      (imgContainer as HTMLDivElement).style.left = `${left}px`;
    }
    if (["rm", "rt", "rb"].includes(image.resizingSide)) {
      width = width + dx < minWidth ? minWidth : width + dx;
    }
    if (["mt", "lt", "rt"].includes(image.resizingSide)) {
      if (height - dy < minHeight) {
        top += height - minHeight;
        height = minHeight;
      } else {
        top += dy;
        height -= dy;
      }
      if (top < 0) top = 0;
      (img as HTMLDivElement).style.top = `${top}px`;
      (imgContainer as HTMLDivElement).style.top = `${top}px`;
    }
    if (["mb", "lb", "rb"].includes(image.resizingSide)) {
      height = height + dy < minHeight ? minHeight : height + dy;
    }
    (img as HTMLDivElement).style.width = `${width}px`;
    (imgContainer as HTMLDivElement).style.width = `${width}px`;
    (img as HTMLDivElement).style.height = `${height}px`;
    (imgContainer as HTMLDivElement).style.height = `${height}px`;
    (img as HTMLDivElement).style.backgroundSize = `${width}px ${height}px`;

    return true;
  }
  return false;
}

export function onImageResizeEnd(
  ctx: Context,
  globalCache: GlobalCache,
  container: HTMLDivElement
) {
  if (globalCache.image?.resizingSide) {
    globalCache.image = undefined;
    const position = getImagePosition(ctx, container);
    if (position) {
      const img = _.find(ctx.insertedImgs, (v) => v.id === ctx.activeImg?.id);
      if (img) {
        img.left = position.left;
        img.top = position.top;
        img.width = position.width;
        img.height = position.height;
      }
    }
  }
}
