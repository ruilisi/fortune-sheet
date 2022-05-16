import { cellPs, editingCommentBox } from "../factories/cell";
import { contextFactory } from "../factories/context";
import {
  newComment,
  deleteComment,
  removeEditingComment,
} from "../../src/modules/comment.ts";

describe("comment related hooks", () => {
  const getContext = () => contextFactory();
  const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };
  const expectedEditingCommentBox = editingCommentBox({ r: 0, c: 0 });
  const expectedCellPs = cellPs();

  test("beforeUpdateComment", async () => {
    const ctx = getContext();
    ctx.luckysheetfile[0].data[0][0] = { ps: {} };
    const parameters = new Array(0);
    const editingCommentBoxEle = document.createElement("div");
    editingCommentBoxEle.innerHTML = "newComment";
    editingCommentBoxEle.dataset.r = 0;
    editingCommentBoxEle.dataset.c = 0;
    let newCache = { editingCommentBoxEle };
    const beforeUpdateCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeUpdateComment: beforeUpdateCommentFn };
    removeEditingComment(ctx, newCache);
    expect(parameters).toEqual([0, 0, "newComment"]);
    expect(ctx.luckysheetfile[0].data[0][0].ps.value).toBe("newComment");
    const ctxFirst = getContext();
    newCache = { editingCommentBoxEle };
    ctxFirst.luckysheetfile[0].data[0][0] = { ps: {} };
    ctxFirst.hooks = { beforeUpdateComment: () => false };
    removeEditingComment(ctxFirst, newCache);
    expect(ctxFirst.luckysheetfile[0].data[0][0].ps).toEqual({});
    newCache = { editingCommentBoxEle };
    ctxFirst.hooks = { beforeUpdateComment: () => true };
    removeEditingComment(ctxFirst, newCache);
    expect(ctxFirst.luckysheetfile[0].data[0][0].ps.value).toBe("newComment");
  });

  test("afterUpdateComment", async () => {
    const ctx = getContext();
    ctx.luckysheetfile[0].data[0][0] = { ps: {} };
    const parameters = new Array(0);
    const editingCommentBoxEle = document.createElement("div");
    editingCommentBoxEle.innerHTML = "newComment";
    editingCommentBoxEle.dataset.r = 0;
    editingCommentBoxEle.dataset.c = 0;
    const newCache = { editingCommentBoxEle };
    const afterUpdateCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterUpdateComment: afterUpdateCommentFn };
    jest.useFakeTimers();
    removeEditingComment(ctx, newCache);
    jest.runAllTimers();
    expect(parameters).toEqual([0, 0, undefined, "newComment"]);
    expect(ctx.luckysheetfile[0].data[0][0].ps.value).toBe("newComment");
  });

  test("beforeInsertComment", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const beforeInsertCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeInsertComment: beforeInsertCommentFn };
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
    expect(parameters).toEqual([0, 0]);
    deleteComment(ctx, cache, 0, 0);
    ctx.hooks = { beforeInsertComment: () => false };
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toBeUndefined();
    ctx.hooks = { beforeInsertComment: () => true };
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
  });

  test("afterInsertComment", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const afterInsertCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterInsertComment: afterInsertCommentFn };
    jest.useFakeTimers();
    newComment(ctx, cache, 0, 0);
    jest.runAllTimers();
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
    expect(parameters).toEqual([0, 0]);
  });

  test("beforeDeleteComment", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const beforeDeleteCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { beforeDeleteComment: beforeDeleteCommentFn };
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
    deleteComment(ctx, cache, 0, 0);
    expect(parameters).toEqual([0, 0]);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toBeUndefined();
    newComment(ctx, cache, 0, 0);
    ctx.hooks = { beforeDeleteComment: () => false };
    deleteComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    ctx.hooks = { beforeDeleteComment: () => true };
    deleteComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toBeUndefined();
  });

  test("afterDeleteComment", async () => {
    const ctx = getContext();
    const parameters = new Array(0);
    const afterDeleteCommentFn = jest
      .fn()
      .mockImplementation((...p) => parameters.push(...p));
    ctx.hooks = { afterDeleteComment: afterDeleteCommentFn };
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
    jest.useFakeTimers();
    deleteComment(ctx, cache, 0, 0);
    jest.runAllTimers();
    expect(parameters).toEqual([0, 0]);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toBeUndefined();
  });
});
