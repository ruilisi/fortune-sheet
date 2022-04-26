import _ from "lodash";
import { mergeBorder } from "./cell";

import { Context, getFlowdata } from "../context";
import { CellMatrix, GlobalCache } from "../types";
import { colLocation, rowLocation } from "./location";

function getArrowCanvasSize(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  let left = toX - 5;

  if (fromX < toX) {
    left = fromX - 5;
  }

  let top = toY - 5;

  if (fromY < toY) {
    top = fromY - 5;
  }

  const width = Math.abs(fromX - toX) + 10;
  const height = Math.abs(fromY - toY) + 10;

  let x1 = width - 5;
  let x2 = 5;

  if (fromX < toX) {
    x1 = 5;
    x2 = width - 5;
  }

  let y1 = height - 5;
  let y2 = 5;

  if (fromY < toY) {
    y1 = 5;
    y2 = height - 5;
  }

  return { left, top, width, height, fromX: x1, fromY: y1, toX: x2, toY: y2 };
}

export function drawArrow(
  rc: string,
  {
    left,
    top,
    width,
    height,
    fromX,
    fromY,
    toX,
    toY,
  }: {
    left: number;
    top: number;
    width: number;
    height: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  },
  color?: string,
  theta?: number,
  headlen?: number
) {
  const canvas = document.getElementById(
    `arrowCanvas-${rc}`
  ) as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!canvas || !ctx) return;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;
  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;
  const { width: canvasWidth, height: canvasHeight } =
    canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  theta = theta || 30;
  headlen = headlen || 6;
  // width = width || 1;
  const arrowWidth = 1;
  color = color || "#000";

  // 计算各角度和对应的P2,P3坐标
  const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
  const angle1 = ((angle + theta) * Math.PI) / 180;
  const angle2 = ((angle - theta) * Math.PI) / 180;
  const topX = headlen * Math.cos(angle1);
  const topY = headlen * Math.sin(angle1);
  const botX = headlen * Math.cos(angle2);
  const botY = headlen * Math.sin(angle2);

  ctx.save();
  ctx.beginPath();

  let arrowX = fromX - topX;
  let arrowY = fromY - topY;

  ctx.moveTo(arrowX, arrowY);
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);

  ctx.lineWidth = arrowWidth;
  ctx.strokeStyle = color;
  ctx.stroke();

  arrowX = toX + topX;
  arrowY = toY + topY;
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(toX, toY);
  arrowX = toX + botX;
  arrowY = toY + botY;
  ctx.lineTo(arrowX, arrowY);

  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

type CommentBoxProps = {
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

export const commentBoxProps: CommentBoxProps = {
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

function getCellTopRightPostion(
  ctx: Context,
  flowdata: CellMatrix,
  r: number,
  c: number
) {
  // let row = ctx.visibledatarow[r];
  let row_pre = r - 1 === -1 ? 0 : ctx.visibledatarow[r - 1];
  let col = ctx.visibledatacolumn[c];
  //  let col_pre = c - 1 === -1 ? 0 : ctx.visibledatacolumn[c - 1];

  const margeset = mergeBorder(ctx, flowdata, r, c);
  if (margeset) {
    // row = margeset.row[1];
    [row_pre] = margeset.row;
    // col_pre = margeset.column[0];
    [, col] = margeset.column;
  }

  const toX = col;
  const toY = row_pre;
  return { toX, toY };
}

export function getCommentBoxByRC(
  ctx: Context,
  flowdata: CellMatrix,
  r: number,
  c: number
) {
  const comment = flowdata[r][c]?.ps;
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
    comment?.left == null
      ? toX + 18 * ctx.zoomRatio
      : comment.left * ctx.zoomRatio;
  let top =
    comment?.top == null
      ? toY - 18 * ctx.zoomRatio
      : comment.top * ctx.zoomRatio;
  const width =
    comment?.width == null
      ? commentBoxProps.defaultWidth * ctx.zoomRatio
      : comment.width * ctx.zoomRatio;
  const height =
    comment?.height == null
      ? commentBoxProps.defaultHeight * ctx.zoomRatio
      : comment.height * ctx.zoomRatio;
  const value = comment?.value == null ? "" : comment.value;

  if (top < 0) {
    top = 2;
  }
  const size = getArrowCanvasSize(left, top, toX, toY);
  const rc = `${r}_${c}`;
  return { r, c, rc, left, top, width, height, value, size, autoFocus: false };
}

export function setEditingComment(
  ctx: Context,
  flowdata: CellMatrix,
  r: number,
  c: number
) {
  ctx.editingCommentBox = getCommentBoxByRC(ctx, flowdata, r, c);
}

export function removeEditingComment(ctx: Context, globalCache: GlobalCache) {
  const { editingCommentBoxEle } = globalCache;
  ctx.editingCommentBox = undefined;
  let r: any = editingCommentBoxEle?.dataset.r;
  let c: any = editingCommentBoxEle?.dataset.c;
  if (!r || !c || !editingCommentBoxEle) return;
  r = parseInt(r, 10);
  c = parseInt(c, 10);
  const value = editingCommentBoxEle.innerHTML || "";
  const flowdata = getFlowdata(ctx);
  globalCache.editingCommentBoxEle = undefined;
  if (!flowdata) return;
  // Hook function
  //   if (!method.createHookFunction("commentUpdateBefore", r, c, value)) {
  //     if (!Store.flowdata[r][c].ps.isShow) {
  //       $(`#${id}`).remove();
  //     }
  //   }

  //  const prevCell = _.cloneDeep(flowdata?.[r][c]) || {};
  const cell = flowdata?.[r][c];
  if (!cell?.ps) return;
  cell.ps.value = value;
  if (!cell.ps.isShow) {
    ctx.commentBoxes = _.filter(ctx.commentBoxes, (v) => v.rc !== `${r}_${c}`);
  }

  // Hook function
  //   setTimeout(() => {
  //     method.createHookFunction('commentUpdateAfter',r,c, previousCell, d[r][c])
  // }, 0);
}

export function newComment(
  ctx: Context,
  globalCache: GlobalCache,
  r: number,
  c: number
) {
  // if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects")){
  //     return;
  // }

  // Hook function
  //   if (!method.createHookFunction("commentInsertBefore", r, c)) {
  //     return;
  //   }
  removeEditingComment(ctx, globalCache);
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  let cell = flowdata[r][c];
  if (cell == null) {
    cell = {};
    flowdata[r][c] = cell;
  }
  cell.ps = {
    left: null,
    top: null,
    width: null,
    height: null,
    value: "",
    isShow: false,
  };
  ctx.editingCommentBox = {
    ...getCommentBoxByRC(ctx, flowdata, r, c),
    autoFocus: true,
  };
}

export function editComment(
  ctx: Context,
  globalCache: GlobalCache,
  r: number,
  c: number
) {
  // if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects")){
  //     return;
  // }
  const flowdata = getFlowdata(ctx);
  removeEditingComment(ctx, globalCache);
  const comment = flowdata?.[r][c]?.ps;
  const commentBoxes = _.concat(ctx.commentBoxes, ctx.editingCommentBox);
  if (_.findIndex(commentBoxes, (v) => v?.rc === `${r}_${c}`) !== -1) {
    const editCommentBox = document.getElementById(
      `comment-editor-${r}_${c}`
    ) as HTMLDivElement;
    editCommentBox?.focus();
  }
  if (comment) {
    ctx.editingCommentBox = {
      ...getCommentBoxByRC(ctx, flowdata, r, c),
      autoFocus: true,
    };
  }
}

export function deleteComment(
  ctx: Context,
  globalCache: GlobalCache,
  r: number,
  c: number
) {
  // if(!checkProtectionAuthorityNormal(Store.currentSheetIndex, "editObjects")){
  //     return;
  // }

  // // Hook function
  // if(!method.createHookFunction('commentDeleteBefore',r,c,Store.flowdata[r][c])){
  //     return;
  // }
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  const cell = flowdata[r][c];
  if (!cell) return;
  cell.ps = undefined;

  // Hook function
  //   setTimeout(() => {
  //     method.createHookFunction("commentDeleteAfter", r, c, Store.flowdata[r][c]);
  //   }, 0);
}

export function showComments(
  ctx: Context,
  commentShowCells: { r: number; c: number }[]
) {
  const flowdata = getFlowdata(ctx);
  if (flowdata) {
    const commentBoxes = commentShowCells.map(({ r, c }) =>
      getCommentBoxByRC(ctx, flowdata, r, c)
    );
    ctx.commentBoxes = commentBoxes;
  }
}

export function showHideComment(
  ctx: Context,
  globalCache: GlobalCache,
  r: number,
  c: number
) {
  const flowdata = getFlowdata(ctx);
  const comment = flowdata?.[r][c]?.ps;
  if (!comment) return;
  const { isShow } = comment;
  const rc = `${r}_${c}`;

  if (isShow) {
    comment.isShow = false;
    ctx.commentBoxes = _.filter(ctx.commentBoxes, (v) => v.rc !== rc);
  } else {
    comment.isShow = true;
  }
}

export function showHideAllComments(ctx: Context) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;

  let isAllShow = true;
  const allComments = [];

  for (let r = 0; r < flowdata.length; r += 1) {
    for (let c = 0; c < flowdata[0].length; c += 1) {
      const cell = flowdata[r][c];
      if (cell?.ps) {
        allComments.push({ r, c });

        if (!cell.ps.isShow) {
          isAllShow = false;
        }
      }
    }
  }

  const rcs = [];
  if (allComments.length > 0) {
    if (isAllShow) {
      // 全部显示，操作为隐藏所有批注
      for (let i = 0; i < allComments.length; i += 1) {
        const { r, c } = allComments[i];
        const comment = flowdata[r][c]?.ps;

        if (comment?.isShow) {
          comment.isShow = false;
          rcs.push(`${r}_${c}`);
        }
      }
      ctx.commentBoxes = [];
    } else {
      // 部分显示或全部隐藏，操作位显示所有批注
      for (let i = 0; i < allComments.length; i += 1) {
        const { r, c } = allComments[i];
        const comment = flowdata[r][c]?.ps;

        if (comment && !comment.isShow) {
          comment.isShow = true;
        }
      }
    }
  }
}

// show comment when mouse is over cell with comment
export function overShowComment(
  ctx: Context,
  e: MouseEvent,
  scrollX: HTMLDivElement,
  scrollY: HTMLDivElement,
  container: HTMLDivElement
) {
  const flowdata = getFlowdata(ctx);
  if (!flowdata) return;
  const { scrollLeft } = scrollX;
  const { scrollTop } = scrollY;
  // $("#luckysheet-postil-overshow").remove();

  // if($(event.target).closest("#luckysheet-cell-main").length == 0){
  //     return;
  // }

  const rect = container.getBoundingClientRect();
  // const mouse = mousePosition(e.pageX, e.pageY, ctx);
  let x = e.pageX + rect.left - ctx.rowHeaderWidth;
  let y = e.pageY - rect.top - ctx.columnHeaderHeight;
  const offsetX = 0;
  const offsetY = 0;

  //   if (
  //     luckysheetFreezen.freezenverticaldata != null &&
  //     mouse[0] <
  //       luckysheetFreezen.freezenverticaldata[0] -
  //         luckysheetFreezen.freezenverticaldata[2]
  //   ) {
  //     offsetX = scrollLeft;
  //   } else {
  x += scrollLeft;
  //   }

  //   if (
  //     luckysheetFreezen.freezenhorizontaldata != null &&
  //     mouse[1] <
  //       luckysheetFreezen.freezenhorizontaldata[0] -
  //         luckysheetFreezen.freezenhorizontaldata[2]
  //   ) {
  //     offsetY = scrollTop;
  //   } else {
  y += scrollTop;
  //   }

  let r = rowLocation(y, ctx.visibledatarow)[2];
  let c = colLocation(x, ctx.visibledatacolumn)[2];

  const margeset = mergeBorder(ctx, flowdata, r, c);
  if (margeset) {
    [, , r] = margeset.row;
    [, , c] = margeset.column;
  }
  const rc = `${r}_${c}`;

  const comment = flowdata[r]?.[c]?.ps;
  if (
    comment == null ||
    comment.isShow ||
    _.findIndex(ctx.commentBoxes, (v) => v.rc === rc) !== -1 ||
    ctx.editingCommentBox?.rc === rc
  ) {
    ctx.hoveredCommentBox = undefined;
    return;
  }
  if (ctx.hoveredCommentBox?.rc === rc) return;

  // let row = ctx.visibledatarow[row_index];
  let row_pre = r - 1 === -1 ? 0 : ctx.visibledatarow[r - 1];
  let col = ctx.visibledatacolumn[c];
  // let col_pre = col_index - 1 === -1 ? 0 : ctx.visibledatacolumn[col_index - 1];

  if (margeset) {
    //  [, row] = margeset.row;
    [row_pre] = margeset.row;

    [, col] = margeset.column;
    //  [col_pre] = margeset.column;
  }

  const toX = col + offsetX;
  const toY = row_pre + offsetY;

  const left =
    comment.left == null
      ? toX + 18 * ctx.zoomRatio
      : comment.left * ctx.zoomRatio;
  let top =
    comment.top == null
      ? toY - 18 * ctx.zoomRatio
      : comment.top * ctx.zoomRatio;

  if (top < 0) {
    top = 2;
  }

  const width =
    comment.width == null
      ? commentBoxProps.defaultWidth * ctx.zoomRatio
      : comment.width * ctx.zoomRatio;
  const height =
    comment.height == null
      ? commentBoxProps.defaultHeight * ctx.zoomRatio
      : comment.height * ctx.zoomRatio;
  const size = getArrowCanvasSize(left, top, toX, toY);
  const value = comment.value == null ? "" : comment.value;

  ctx.hoveredCommentBox = {
    r,
    c,
    rc,
    left,
    top,
    width,
    height,
    size,
    value,
    autoFocus: false,
  };
}

export function getCommentBoxPosition(
  ctx: Context,
  commentId: string,
  container: HTMLDivElement
) {
  const box = document.getElementById(commentId);
  if (!box) return undefined;
  // eslint-disable-next-line prefer-const
  let { top, left, width, height } = box.getBoundingClientRect();
  const rect = container.getBoundingClientRect();
  left -= ctx.rowHeaderWidth + rect.left;
  top -= ctx.columnHeaderHeight + rect.top;
  return { left, top, width, height };
}

export function onCommentBoxResizeStart(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLDivElement,
  { r, c, rc }: { r: number; c: number; rc: string },
  resizingId: string,
  resizingSide: string
) {
  const position = getCommentBoxPosition(ctx, resizingId, container);
  if (position) {
    _.set(globalCache, "commentBox", {
      cursorMoveStartPosition: {
        x: e.pageX,
        y: e.pageY,
      },
      resizingId,
      resizingSide,
      commentRC: { r, c, rc },
      boxInitialPosition: position,
    });
  }
}

export function onCommentBoxResize(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent
) {
  const commentBox = globalCache?.commentBox;
  if (commentBox?.resizingId && commentBox.resizingSide) {
    const box = document.getElementById(commentBox.resizingId);
    const { x: startX, y: startY } = commentBox.cursorMoveStartPosition!;
    let { top, left, width, height } = commentBox.boxInitialPosition!;
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;
    const minHeight = 60 * ctx.zoomRatio;
    const minWidth = 1.5 * 60 * ctx.zoomRatio;
    if (["lm", "lt", "lb"].includes(commentBox.resizingSide)) {
      if (width - dx < minWidth) {
        left += width - minWidth;
        width = minWidth;
      } else {
        left += dx;
        width -= dx;
      }
      if (left < 0) left = 0;
      (box as HTMLDivElement).style.left = `${left}px`;
    }
    if (["rm", "rt", "rb"].includes(commentBox.resizingSide)) {
      width = width + dx < minWidth ? minWidth : width + dx;
    }
    if (["mt", "lt", "rt"].includes(commentBox.resizingSide)) {
      if (height - dy < minHeight) {
        top += height - minHeight;
        height = minHeight;
      } else {
        top += dy;
        height -= dy;
      }
      if (top < 0) top = 0;
      (box as HTMLDivElement).style.top = `${top}px`;
    }
    if (["mb", "lb", "rb"].includes(commentBox.resizingSide)) {
      height = height + dy < minHeight ? minHeight : height + dy;
    }
    (box as HTMLDivElement).style.width = `${width}px`;
    (box as HTMLDivElement).style.height = `${height}px`;
    return true;
  }
  return false;
}

export function onCommentBoxResizeEnd(
  ctx: Context,
  globalCache: GlobalCache,
  container: HTMLDivElement
) {
  if (globalCache.commentBox?.resizingId) {
    const {
      resizingId,
      commentRC: { r, c },
    } = globalCache.commentBox;
    globalCache.commentBox.resizingId = undefined;
    const position = getCommentBoxPosition(ctx, resizingId, container);
    if (position) {
      const { top, left, width, height } = position;
      const flowdata = getFlowdata(ctx);
      const cell = flowdata?.[r][c];
      if (!flowdata || !cell?.ps) return;
      cell.ps.left = left / ctx.zoomRatio;
      cell.ps.top = top / ctx.zoomRatio;
      cell.ps.width = width / ctx.zoomRatio;
      cell.ps.height = height / ctx.zoomRatio;
      setEditingComment(ctx, flowdata, r, c);
    }
  }
}

export function onCommentBoxMoveStart(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent,
  container: HTMLDivElement,
  { r, c, rc }: { r: number; c: number; rc: string },
  movingId: string
) {
  const position = getCommentBoxPosition(ctx, movingId, container);
  if (position) {
    const { top, left } = position;
    _.set(globalCache, "commentBox", {
      cursorMoveStartPosition: {
        x: e.pageX,
        y: e.pageY,
      },
      movingId,
      commentRC: { r, c, rc },
      boxInitialPosition: { left, top },
    });
  }
}

export function onCommentBoxMove(
  ctx: Context,
  globalCache: GlobalCache,
  e: MouseEvent
) {
  const commentBox = globalCache?.commentBox;
  if (commentBox?.movingId) {
    const box = document.getElementById(commentBox.movingId);
    const { x: startX, y: startY } = commentBox.cursorMoveStartPosition!;
    let { top, left } = commentBox.boxInitialPosition!;
    left += e.pageX - startX;
    top += e.pageY - startY;
    if (top < 0) top = 0;
    (box as HTMLDivElement).style.left = `${left}px`;
    (box as HTMLDivElement).style.top = `${top}px`;
    return true;
  }
  return false;
}

export function onCommentBoxMoveEnd(
  ctx: Context,
  globalCache: GlobalCache,
  container: HTMLDivElement
) {
  if (globalCache.commentBox?.movingId) {
    const {
      movingId,
      commentRC: { r, c },
    } = globalCache.commentBox;
    globalCache.commentBox.movingId = undefined;
    const position = getCommentBoxPosition(ctx, movingId, container);
    if (position) {
      const { top, left } = position;
      const flowdata = getFlowdata(ctx);
      const cell = flowdata?.[r][c];
      if (!flowdata || !cell?.ps) return;
      cell.ps.left = left / ctx.zoomRatio;
      cell.ps.top = top / ctx.zoomRatio;
      setEditingComment(ctx, flowdata, r, c);
    }
  }
}

/*
const luckysheetPostil = {
  getArrowCanvasSize(fromX, fromY, toX, toY) {
    let left = toX - 5;

    if (fromX < toX) {
      left = fromX - 5;
    }

    let top = toY - 5;

    if (fromY < toY) {
      top = fromY - 5;
    }

    const width = Math.abs(fromX - toX) + 10;
    const height = Math.abs(fromY - toY) + 10;

    let x1 = width - 5;
    let x2 = 5;

    if (fromX < toX) {
      x1 = 5;
      x2 = width - 5;
    }

    let y1 = height - 5;
    let y2 = 5;

    if (fromY < toY) {
      y1 = 5;
      y2 = height - 5;
    }

    return [left, top, width, height, x1, y1, x2, y2];
  },
  drawArrow(ctx, fromX, fromY, toX, toY, theta, headlen, width, color) {
    theta = getObjType(theta) == "undefined" ? 30 : theta;
    headlen = getObjType(headlen) == "undefined" ? 6 : headlen;
    width = getObjType(width) == "undefined" ? 1 : width;
    color = getObjType(color) == "undefined" ? "#000" : color;

    // 计算各角度和对应的P2,P3坐标
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;
    const topX = headlen * Math.cos(angle1);
    const topY = headlen * Math.sin(angle1);
    const botX = headlen * Math.cos(angle2);
    const botY = headlen * Math.sin(angle2);

    ctx.save();
    ctx.beginPath();

    let arrowX = fromX - topX;
    let arrowY = fromY - topY;

    ctx.moveTo(arrowX, arrowY);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();

    arrowX = toX + topX;
    arrowY = toY + topY;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(toX, toY);
    arrowX = toX + botX;
    arrowY = toY + botY;
    ctx.lineTo(arrowX, arrowY);

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },
  buildAllPs(data) {
    const _this = this;

    $("#luckysheet-cell-main #luckysheet-postil-showBoxs").empty();

    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < data[0].length; c++) {
        if (data[r][c] != null && data[r][c].ps != null) {
          const postil = data[r][c].ps;
          _this.buildPs(r, c, postil);
        }
      }
    }

    _this.init();
  },
  buildPs(r, c, postil) {
    if ($(`#luckysheet-postil-show_${r}_${c}`).length > 0) {
      $(`#luckysheet-postil-show_${r}_${c}`).remove();
    }

    if (postil == null) {
      return;
    }

    const _this = this;
    const isShow = postil.isShow == null ? false : postil.isShow;

    if (isShow) {
      let row = Store.visibledatarow[r];
      let row_pre = r - 1 == -1 ? 0 : Store.visibledatarow[r - 1];
      let col = Store.visibledatacolumn[c];
      let col_pre = c - 1 == -1 ? 0 : Store.visibledatacolumn[c - 1];

      const margeset = menuButton.mergeborer(Store.flowdata, r, c);
      if (margeset) {
        row = margeset.row[1];
        row_pre = margeset.row[0];

        col = margeset.column[1];
        col_pre = margeset.column[0];
      }

      const toX = col;
      const toY = row_pre;

      const left =
        postil.left == null
          ? toX + 18 * Store.zoomRatio
          : postil.left * Store.zoomRatio;
      let top =
        postil.top == null
          ? toY - 18 * Store.zoomRatio
          : postil.top * Store.zoomRatio;
      const width =
        postil.width == null
          ? _this.defaultWidth * Store.zoomRatio
          : postil.width * Store.zoomRatio;
      const height =
        postil.height == null
          ? _this.defaultHeight * Store.zoomRatio
          : postil.height * Store.zoomRatio;
      const value = postil.value == null ? "" : postil.value;

      if (top < 0) {
        top = 2;
      }

      const size = _this.getArrowCanvasSize(left, top, toX, toY);

      let commentDivs = "";
      const valueLines = value.split("\n");
      for (const line of valueLines) {
        commentDivs += `<div>${_this.htmlEscape(line)}</div>`;
      }

      const html =
        `<div id="luckysheet-postil-show_${r}_${c}" class="luckysheet-postil-show">` +
        `<canvas class="arrowCanvas" width="${size[2]}" height="${size[3]}" style="position:absolute;left:${size[0]}px;top:${size[1]}px;z-index:100;pointer-events:none;"></canvas>` +
        `<div class="luckysheet-postil-show-main" style="width:${width}px;height:${height}px;color:#000;padding:5px;border:1px solid #000;background-color:rgb(255,255,225);position:absolute;left:${left}px;top:${top}px;box-sizing:border-box;z-index:100;">` +
        `<div class="luckysheet-postil-dialog-move">` +
        `<div class="luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-t" data-type="t"></div>` +
        `<div class="luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-r" data-type="r"></div>` +
        `<div class="luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-b" data-type="b"></div>` +
        `<div class="luckysheet-postil-dialog-move-item luckysheet-postil-dialog-move-item-l" data-type="l"></div>` +
        `</div>` +
        `<div class="luckysheet-postil-dialog-resize" style="display:none;">` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-lt" data-type="lt"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-mt" data-type="mt"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-lm" data-type="lm"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-rm" data-type="rm"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-rt" data-type="rt"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-lb" data-type="lb"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-mb" data-type="mb"></div>` +
        `<div class="luckysheet-postil-dialog-resize-item luckysheet-postil-dialog-resize-item-rb" data-type="rb"></div>` +
        `</div>` +
        `<div style="width:100%;height:100%;overflow:hidden;">` +
        `<div class="formulaInputFocus" style="width:${width - 12}px;height:${
          height - 12
        }px;line-height:20px;box-sizing:border-box;text-align: center;;word-break:break-all;" spellcheck="false" contenteditable="true">${commentDivs}</div>` +
        `</div>` +
        `</div>` +
        `</div>`;

      $(html).appendTo($("#luckysheet-cell-main #luckysheet-postil-showBoxs"));

      const ctx = $(`#luckysheet-postil-show_${r}_${c} .arrowCanvas`)
        .get(0)
        .getContext("2d");

      _this.drawArrow(ctx, size[4], size[5], size[6], size[7]);
    }
  },
};

export default luckysheetPostil;
*/
