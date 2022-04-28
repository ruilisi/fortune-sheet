import { cellPs, editingCommentBox } from "../../../../../tests/mockData/cell";
import { context } from "../../../../../tests/mockData/context";
import {
  newComment,
  deleteComment,
  showHideComment,
  showHideAllComments,
} from "../../modules/comment";

describe("comment", () => {
  const getContext = () => context();
  const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };
  const expectedEditingCommentBox = editingCommentBox({ r: 0, c: 0 });
  const expectedCellPs = cellPs();

  test("new comment and delete comment", async () => {
    const ctx = getContext();
    newComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toEqual(expectedCellPs);
    expect(ctx.editingCommentBox).toEqual(expectedEditingCommentBox);
    deleteComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps).toBeUndefined();
  });
  test("show comment and hide comment", async () => {
    const ctx = getContext();
    newComment(ctx, cache, 0, 0);
    showHideComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps.isShow).toBe(true);
    showHideComment(ctx, cache, 0, 0);
    expect(ctx.luckysheetfile[0].data[0][0].ps.isShow).toBe(false);
  });
  test("show all comments and hide all comments", async () => {
    const ctx = getContext();
    newComment(ctx, cache, 0, 0);
    newComment(ctx, cache, 1, 1);
    showHideAllComments(ctx);
    expect(ctx.luckysheetfile[0].data[0][0].ps.isShow).toBe(true);
    expect(ctx.luckysheetfile[0].data[1][1].ps.isShow).toBe(true);
    showHideAllComments(ctx);
    expect(ctx.luckysheetfile[0].data[0][0].ps.isShow).toBe(false);
    expect(ctx.luckysheetfile[0].data[1][1].ps.isShow).toBe(false);
  });
});
