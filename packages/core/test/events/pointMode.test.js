import { contextFactory, selectionFactory } from "../factories/context";
import { handleCellAreaMouseDown } from "../../src/events/mouse";
import {
  applyPointModeStep,
  handleFormulaArrowKey,
  handleGlobalKeyDown,
  resolvePointModeStep,
} from "../../src/events/keyboard";
import { functionHTMLGenerate } from "../../src/modules/formula";

// Characterization tests for "point mode": picking a cell reference while a
// formula is being edited, instead of typing it. They pin the behaviour of the
// mouse driver so the shared entry point extracted for the keyboard driver can
// be shown not to change it.
describe("formula point mode", () => {
  // jsdom has no innerText, and the mouse path reads the editor through it.
  // textContent is exact for the single-line spans a formula is built from.
  const innerTextDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "innerText"
  );
  beforeAll(() => {
    if (innerTextDescriptor) return;
    Object.defineProperty(HTMLElement.prototype, "innerText", {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      },
    });
  });
  afterAll(() => {
    if (!innerTextDescriptor) delete HTMLElement.prototype.innerText;
  });

  const container = document.createElement("div");
  container.getBoundingClientRect = () => ({
    width: 1000,
    height: 400,
    left: 0,
    top: 0,
  });
  const cache = { editingCommentBoxEle: { dataset: { r: 0, c: 0 } } };

  let cellInput;
  let fxInput;

  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
      luckysheetCellUpdate: [0, 0],
      formulaRangeHighlight: [],
      sheetFocused: true,
    });

  // Put the caret at the end of the formula, the way the browser leaves it
  // after the user types the opening parenthesis.
  const editFormulaIn = (editor, text) => {
    editor.innerHTML = functionHTMLGenerate(text);
    const spans = editor.querySelectorAll("span");
    const lastText = spans[spans.length - 1].firstChild;
    const range = document.createRange();
    range.setStart(lastText, lastText.length);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const editFormula = (text) => editFormulaIn(cellInput, text);

  // Put the caret at the start of the `nth` span whose text is `token` -- that
  // is, directly after the token before it. Every other helper here leaves the
  // caret at the end of the formula, which is where *typing* one leaves it;
  // this is where *editing* one leaves it, and the two are not the same
  // position to point mode.
  const caretBefore = (editor, token, nth = 0) => {
    const span = Array.from(editor.querySelectorAll("span")).filter(
      (el) => el.textContent === token
    )[nth];
    const range = document.createRange();
    range.setStart(span.firstChild, 0);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Put the caret `offset` characters into the span whose text is `token` --
  // *within* a token rather than at a boundary between two, which is the only
  // way to reach a position inside a string literal.
  const caretInside = (editor, token, offset) => {
    const span = Array.from(editor.querySelectorAll("span")).find(
      (el) => el.textContent === token
    );
    const range = document.createRange();
    range.setStart(span.firstChild, offset);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const clickCell = (ctx, pageX, pageY, init = {}) => {
    const mouseEvent = new MouseEvent("click", { button: 0, ...init });
    mouseEvent.pageX = pageX;
    mouseEvent.pageY = pageY;
    handleCellAreaMouseDown(
      ctx,
      cache,
      mouseEvent,
      cellInput,
      container,
      fxInput
    );
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    cellInput = document.createElement("div");
    cellInput.id = "luckysheet-rich-text-editor";
    fxInput = document.createElement("div");
    fxInput.id = "luckysheet-functionbox-cell";
    document.body.appendChild(cellInput);
    document.body.appendChild(fxInput);
  });

  test("clicking a cell after '(' inserts its reference into the formula", () => {
    const ctx = getContext();
    editFormula("=SUM(");

    clickCell(ctx, 369, 79); // row 3, column 4 -> E4

    expect(cellInput.textContent).toBe("=SUM(E4");
    expect(fxInput.innerHTML).toBe(cellInput.innerHTML);
    expect(
      cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
    ).toHaveLength(1);
  });

  test("the inserted reference records the phantom selection and its overlay", () => {
    const ctx = getContext();
    editFormula("=SUM(");

    clickCell(ctx, 369, 79);

    expect(ctx.formulaCache.rangestart).toBe(true);
    expect(ctx.formulaCache.rangedrag_column_start).toBe(false);
    expect(ctx.formulaCache.rangedrag_row_start).toBe(false);
    expect(ctx.formulaCache.func_selectedrange).toEqual({
      left: 296,
      width: 73,
      top: 60,
      height: 19,
      left_move: 296,
      width_move: 73,
      top_move: 60,
      height_move: 19,
      row: [3, 3],
      column: [4, 4],
      row_focus: 3,
      column_focus: 4,
    });
    expect(ctx.formulaRangeSelect).toEqual({
      rangeIndex: ctx.formulaCache.rangechangeindex,
      left: 296,
      top: 60,
      width: 73,
      height: 19,
    });
    expect(ctx.formulaCache.selectingRangeIndex).toBe(
      ctx.formulaCache.rangechangeindex
    );
  });

  test("clicking a second cell replaces the reference rather than appending one", () => {
    const ctx = getContext();
    editFormula("=SUM(");

    clickCell(ctx, 369, 79); // E4
    clickCell(ctx, 295, 59); // row 2, column 3 -> D3

    expect(cellInput.textContent).toBe("=SUM(D3");
    expect(
      cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
    ).toHaveLength(1);
    expect(ctx.formulaCache.func_selectedrange).toMatchObject({
      row: [2, 2],
      column: [3, 3],
      left: 222,
      top: 40,
    });
  });

  // The keyboard half of point mode: the arrows pick a reference instead of
  // walking the caret through the formula text.
  // The plain-click tests above cover `enterPointModeAt`. These two cover the
  // only branches of the mousedown handler whose control flow the extraction
  // actually changed -- shift-extend, which keeps the selection it has just
  // mutated and so calls `applyPointModeSelection` directly, and ctrl-click,
  // which commits the previous reference before starting a new one. Both were
  // uncovered, which meant the refactor was demonstrated only on the path that
  // did not branch. Verified against `2f9e972~1`: the pre-refactor source
  // produces these values character for character.
  describe("the mouse branches the extraction rerouted", () => {
    test("shift-clicking extends the reference to a range", () => {
      const ctx = getContext();
      editFormula("=SUM(");

      clickCell(ctx, 369, 79); // E4
      expect(cellInput.textContent).toBe("=SUM(E4");

      clickCell(ctx, 100, 30, { shiftKey: true }); // B2

      expect(cellInput.textContent).toBe("=SUM(B2:E4");
      // row_focus/column_focus stay on the anchor the extension grew from, so
      // a further shift-click re-extends from E4 rather than from B2.
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        row: [1, 3],
        column: [1, 4],
        row_focus: 3,
        column_focus: 4,
      });
      expect(ctx.formulaCache.rangestart).toBe(true);
    });

    test("shift-extend keeps the base rectangle and moves only the *_move one", () => {
      const ctx = getContext();
      editFormula("=SUM(");

      clickCell(ctx, 369, 79); // E4: base and _move agree
      clickCell(ctx, 100, 30, { shiftKey: true }); // B2

      // This is the property that separates the two helpers, and the reason
      // the branch calls `applyPointModeSelection` rather than
      // `enterPointModeAt`: the shift path builds its result by mutating the
      // previous selection, so `left/top/width/height` stay on E4 -- stale by
      // design -- while the extended rectangle travels in the `_move` fields.
      // `enterPointModeAt` replaces all eight, so routing this branch through
      // it would overwrite the base with B2's geometry and silently change
      // where a subsequent drag measures from. Asserted so that swap cannot
      // happen unnoticed.
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        left: 296,
        top: 60,
        width: 73,
        height: 19,
        left_move: 74,
        top_move: 20,
        width_move: 295,
        height_move: 59,
      });
    });

    test("ctrl-clicking starts a second reference instead of replacing the first", () => {
      const ctx = getContext();
      editFormula("=SUM(");

      clickCell(ctx, 369, 79); // E4
      clickCell(ctx, 100, 30, { ctrlKey: true }); // B2

      // The comma is the branch's own work -- it commits the previous
      // reference into the text before handing off -- and then the new pick
      // goes through the shared entry point like any other, which is why the
      // selection is replaced outright here and not merged.
      expect(cellInput.textContent).toBe("=SUM(E4,B2");
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        row: [1, 1],
        column: [1, 1],
        row_focus: 1,
        column_focus: 1,
        left: 74,
        top: 20,
        left_move: 74,
        top_move: 20,
      });
      expect(ctx.formulaCache.rangestart).toBe(true);
      expect(
        cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
      ).toHaveLength(2);
    });

    test("clicking after a two-character operator inserts its reference", () => {
      const ctx = getContext();
      editFormula("=IF(A1>=");

      clickCell(ctx, 369, 79); // row 3, column 4 -> E4

      // ">=" is emitted as one span, and israngeseleciton read its last
      // character with substring(txt.length - 1, 1) -- an end index where a
      // length was meant, which substring resolves by swapping, giving "".
      // So no reference could be placed after >= <= <> == or != . Asserted on
      // the mouse as well as the keyboard because the defect is in the shared
      // predicate, and a keyboard-only test would under-claim the fix.
      expect(cellInput.textContent).toBe("=IF(A1>=E4");
    });
  });

  test("a caret inside a string literal is not a reference position", () => {
    const ctx = getContext();
    editFormula('=TEXT(A1,"#,##0.00")');
    caretInside(cellInput, '"#,##0.00"', 3); // after the "," in the format

    clickCell(ctx, 369, 79); // row 3, column 4 -> E4

    // The comma belongs to the number format, not to the formula. Reading the
    // character behind the caret cannot tell those apart, so correcting the
    // substring(len, 1) index arithmetic -- which used to yield "" for any
    // token longer than one character, and so declined here by accident --
    // would otherwise let a click write a reference outside the string:
    // '=TEXT(A1,"#,##0.00"E4)'. The forward test mostly shields the keyboard,
    // the next character here being "#", but the mouse has no forward test --
    // so this is asserted on the click path.
    expect(cellInput.textContent).toBe('=TEXT(A1,"#,##0.00")');
    expect(ctx.formulaCache.rangestart).toBeFalsy();

    // Declining is not the same as doing nothing: the click falls past the
    // formula branch to updateCell, which commits the cell and ends the edit
    // session. That is the right outcome -- the click selects a cell instead
    // of corrupting the formula -- and it is why the control below needs a
    // context of its own rather than reusing this one.
    expect(ctx.luckysheetCellUpdate).toHaveLength(0);

    // The positive control: the same "," behind the caret and the same click,
    // with the comma the formula's own rather than text inside a literal. So
    // the decline above is the string test doing its job, not point mode
    // failing to run on a TEXT() call.
    const stillPicks = getContext();
    editFormula("=TEXT(A1,)");
    caretBefore(cellInput, ")");

    clickCell(stillPicks, 369, 79);

    expect(cellInput.textContent).toBe("=TEXT(A1,E4)");
    expect(stillPicks.formulaCache.rangestart).toBe(true);
  });

  describe("arrow keys", () => {
    let grid;

    const pressArrow = (ctx, key, target) => {
      target.focus();
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      handleGlobalKeyDown(
        ctx,
        cellInput,
        fxInput,
        event,
        { undoList: [], redoList: [] },
        () => {},
        () => {}
      );
      return event;
    };

    beforeEach(() => {
      grid = document.createElement("div");
      document.body.appendChild(grid);
      grid.appendChild(cellInput);
      grid.appendChild(fxInput);
      cellInput.className = "luckysheet-cell-input";
      cellInput.tabIndex = 0;
      fxInput.tabIndex = 0;
    });

    test("the first arrow picks the cell next to the one being edited", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");

      const event = pressArrow(ctx, "ArrowUp", cellInput);

      // Editing C3, so Up is C2 -- not C3, which would be circular.
      expect(cellInput.textContent).toBe("=SUM(C2");
      expect(event.defaultPrevented).toBe(true);
      expect(ctx.formulaCache.rangestart).toBe(true);
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        row: [1, 1],
        column: [2, 2],
        row_focus: 1,
        column_focus: 2,
      });
    });

    test("a further arrow replaces the reference rather than appending one", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput); // C2
      pressArrow(ctx, "ArrowUp", cellInput); // C1

      expect(cellInput.textContent).toBe("=SUM(C1");
      expect(
        cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
      ).toHaveLength(1);
    });

    test("the reference stops at the edge of the sheet, key still consumed", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput); // C2
      pressArrow(ctx, "ArrowUp", cellInput); // C1
      const event = pressArrow(ctx, "ArrowUp", cellInput); // nowhere left to go

      expect(cellInput.textContent).toBe("=SUM(C1");
      expect(event.defaultPrevented).toBe(true);
    });

    test("hidden rows are stepped over, not landed on", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      ctx.config = { rowhidden: { 1: 0 } };
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(C1");
    });

    test("with the caret away from a reference position the arrows still move the caret", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(A1)");
      const before = cellInput.innerHTML;

      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.innerHTML).toBe(before);
      expect(ctx.formulaCache.rangestart).toBeFalsy();
      expect(event.defaultPrevented).toBe(false);

      // The positive control, and the reason the three assertions above are
      // worth making: on their own they also hold with point mode absent
      // entirely, so they pin nothing without something that distinguishes
      // them. The only difference here is where the caret sits -- the same
      // editor, the same cell, a formula whose last token is `(` instead of
      // `)` -- and that is enough to pick. So the decline above is the caret
      // test doing its job, not the feature failing to run.
      editFormula("=SUM(");
      const picked = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(C2");
      expect(ctx.formulaCache.rangestart).toBe(true);
      expect(picked.defaultPrevented).toBe(true);
    });

    test("an arrow moves the caret when an operand already follows it", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [3, 1]; // B4, the cell in the bug report
      editFormula("=(B2-E2)^2/E2");
      caretBefore(cellInput, "E2", 1); // between the "/" and the second E2
      const before = cellInput.innerHTML;

      const event = pressArrow(ctx, "ArrowLeft", cellInput);

      // The reported bug: arrowing back through an existing formula to add "$"
      // signs wrote a reference at every caret position that followed an
      // operator, giving "=(B2-E2)^2/A4E2" instead of moving the caret. The
      // character behind the caret says a reference *may* go here; the operand
      // ahead of it says one is not missing.
      expect(cellInput.innerHTML).toBe(before);
      expect(ctx.formulaCache.rangestart).toBeFalsy();
      expect(event.defaultPrevented).toBe(false);

      // The positive control: same cell, same editor, the same "/" behind the
      // caret -- only the operand after it is gone. So the decline above is the
      // forward test doing its job, not point mode failing to run at all.
      editFormula("=(B2-E2)^2/");
      const picked = pressArrow(ctx, "ArrowLeft", cellInput);

      expect(cellInput.textContent).toBe("=(B2-E2)^2/A4");
      expect(ctx.formulaCache.rangestart).toBe(true);
      expect(picked.defaultPrevented).toBe(true);
    });

    test("a trailing close paren does not count as an operand", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(A1,)");
      caretBefore(cellInput, ")");

      // A missing argument is still missing when the call is already closed,
      // so the forward test ignores trailing ")" and whitespace. Without that
      // exception this fix would take the gesture away from every formula
      // whose parentheses are balanced as it is written.
      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(A1,C2)");
      expect(event.defaultPrevented).toBe(true);
    });

    test("a trailing close paren does not count even mid-formula", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(A1,)+1");
      caretBefore(cellInput, ")");

      // The slot is empty wherever the formula ends: a ")" ahead proves it even
      // with "+1" after the call. Testing the whole tail instead of the slot
      // declined this and made "=SUM(A1,|)" pick only when the ")" was the last
      // character of the formula.
      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(A1,C2)+1");
      expect(event.defaultPrevented).toBe(true);
    });

    test("a pick started with the mouse keeps stepping with the arrows", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=(B2-)*2");
      caretBefore(cellInput, ")");

      clickCell(ctx, 369, 79); // E4
      expect(cellInput.textContent).toBe("=(B2-E4)*2");
      expect(ctx.formulaCache.rangestart).toBe(true);

      // Point mode is running, and the pick left the caret inside the
      // reference just written -- its last character is the digit "4", which
      // israngeseleciton (the character-behind test) declines. rangestart
      // short-circuits that, and this is what pins the ordering: ask
      // israngeseleciton first and a reference picked with the mouse could
      // never afterwards be adjusted from the keyboard.
      //
      // The obvious version of this test -- arrow twice from "=SUM(" -- pins
      // the same thing, since a picked reference always ends in a digit; this
      // one adds the ")*2" tail only to show the short-circuit runs before the
      // forward test too, not just before israngeseleciton.
      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=(B2-E3)*2");
      expect(event.defaultPrevented).toBe(true);
    });

    test("a plain arrow picks into an empty slot the mouse can reach too", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=(B2-)*2");
      caretBefore(cellInput, ")");

      // The mouse can pick here -- the slot before ")" is empty -- and so must
      // the keyboard: the forward test asks about the slot the caret sits in,
      // not the whole tail, so the ")*2" after it is no bar.
      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=(B2-C2)*2");
      expect(event.defaultPrevented).toBe(true);
    });

    test("point mode starts after a two-character operator", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=IF(A1>=");

      const event = pressArrow(ctx, "ArrowUp", cellInput);

      // The keyboard half of the substring() defect covered by the mouse test
      // above. Fails on master, where ">=" yields "" and the arrow is declined.
      expect(cellInput.textContent).toBe("=IF(A1>=C2");
      expect(event.defaultPrevented).toBe(true);
    });

    test("arrowing back onto the edited cell is allowed", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");

      // The no-self-reference rule covers the *first* arrow only: it seeds off
      // the edited cell so a formula never opens by referring to itself. Once
      // point mode is running the step starts from the pick, so stepping away
      // and back lands on C3 while C3 is what is being edited. Excel permits
      // this, and refusing the key instead would make an arrow silently stop
      // working; the circularity is reported on commit. Asserted so the
      // narrowed comment on resolvePointModeStep and the code cannot drift.
      pressArrow(ctx, "ArrowDown", cellInput);
      expect(cellInput.textContent).toBe("=SUM(C4");

      const event = pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(C3");
      expect(event.defaultPrevented).toBe(true);
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        row: [2, 2],
        column: [2, 2],
      });
      expect(
        cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
      ).toHaveLength(1);
    });

    test("editing in the formula bar writes there and mirrors to the cell", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormulaIn(fxInput, "=SUM(");
      fxInput.focus();

      // The formula bar sits outside the grid and owns its own keydown handler,
      // so handleGlobalKeyDown never sees these keys -- FxEditor calls the
      // driver directly. This is that call.
      const handled = handleFormulaArrowKey(
        ctx,
        cellInput,
        fxInput,
        new KeyboardEvent("keydown", { key: "ArrowUp" })
      );

      expect(handled).toBe(true);
      expect(fxInput.textContent).toBe("=SUM(C2");
      expect(cellInput.innerHTML).toBe(fxInput.innerHTML);
      // Nothing in the driver moves focus; the caret stays where the user put it.
      expect(document.activeElement).toBe(fxInput);
    });

    test("a merged reference is stepped over, not re-entered", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [3, 0];
      // B2:B3 merged. Both halves of how a merge is stored have to be present:
      // the cells' own `mc`, which mergeBorder reads to find the span, and
      // config.merge, which rangeSetValue reads to decide what to write. A
      // fixture with only the first makes rangeSetValue take a branch the app
      // never takes.
      ctx.luckysheetfile[0].data[1][1] = { mc: { r: 1, c: 1, rs: 2, cs: 1 } };
      ctx.luckysheetfile[0].data[2][1] = { mc: { r: 1, c: 1 } };
      ctx.config = { merge: { "1_1": { r: 1, c: 1, rs: 2, cs: 1 } } };
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput); // A3
      pressArrow(ctx, "ArrowRight", cellInput); // onto the merge

      // Upstream collapses a merged reference to the merge's anchor before
      // writing it -- shared with the mouse, not this feature's doing.
      expect(cellInput.textContent).toBe("=SUM(B2");
      // ...but the phantom selection still spans the merge, which is what the
      // next step has to leave from.
      expect(ctx.formulaCache.func_selectedrange).toMatchObject({
        row: [1, 2],
        column: [1, 1],
      });

      // One press clears the whole merge rather than landing inside it again.
      pressArrow(ctx, "ArrowUp", cellInput);
      expect(cellInput.textContent).toBe("=SUM(B1");
    });

    test("the reference stops at the last row and column too", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");

      // The fixture is 4x4, so row 3 / column 3 are the last of each.
      pressArrow(ctx, "ArrowDown", cellInput); // D3 -> C4
      expect(cellInput.textContent).toBe("=SUM(C4");
      const atEdge = pressArrow(ctx, "ArrowDown", cellInput);
      expect(cellInput.textContent).toBe("=SUM(C4");
      expect(atEdge.defaultPrevented).toBe(true);

      pressArrow(ctx, "ArrowRight", cellInput);
      expect(cellInput.textContent).toBe("=SUM(D4");
      pressArrow(ctx, "ArrowRight", cellInput);
      expect(cellInput.textContent).toBe("=SUM(D4");
    });

    test("the reference goes at the innermost open call", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(AVERAGE(");

      pressArrow(ctx, "ArrowUp", cellInput);

      expect(cellInput.textContent).toBe("=SUM(AVERAGE(C2");
    });

    // applyPointModeStep ends with scrollToHighlightCell, the part that keeps a
    // pick the user cannot see from being silently off-screen. The fixture
    // leaves cellmainHeight/cellmainWidth undefined, so the "scrolled past the
    // far edge" branch of that function is NaN-guarded out and only the "scrolled
    // past the near edge" branch can fire -- which makes both numbers below exact
    // rather than approximate.
    test("a pick that is scrolled out of view brings the viewport back", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      ctx.scrollTop = 500;
      ctx.scrollLeft = 500;
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput); // C3 -> C2

      expect(cellInput.textContent).toBe("=SUM(C2");
      // Both axes move: scrollToHighlightCell is handed the row and the column.
      // Row 1's predecessor edge is visibledatarow[0] = 20, less the 20px margin.
      expect(ctx.scrollTop).toBe(0);
      // Column 2's predecessor edge is visibledatacolumn[1] = 148, same margin.
      expect(ctx.scrollLeft).toBe(128);
    });

    test("a pick already in view leaves the viewport alone", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      // Deliberately not 0/0. Starting from the origin, an implementation that
      // scrolled unconditionally would land on 0 as well and the test would
      // pass anyway. From an offset that already has the target in view --
      // below visibledatarow[0]=20 and visibledatacolumn[1]=148 -- the same bug
      // lands on 0/128 instead, which these assertions catch.
      ctx.scrollTop = 15;
      ctx.scrollLeft = 100;
      editFormula("=SUM(");

      pressArrow(ctx, "ArrowUp", cellInput); // C3 -> C2

      expect(cellInput.textContent).toBe("=SUM(C2");
      expect(ctx.scrollTop).toBe(15);
      expect(ctx.scrollLeft).toBe(100);
    });

    describe("modified arrows are not point mode", () => {
      // The grid filters these out long before its arrow branch; the formula
      // bar switches on `key` alone. The guard lives in canEnterPointMode so
      // both drivers inherit it -- without it, Shift+Left in the formula bar
      // writes a reference instead of selecting text.
      test.each([
        ["shiftKey", { shiftKey: true }],
        ["ctrlKey", { ctrlKey: true }],
        ["metaKey", { metaKey: true }],
        ["altKey", { altKey: true }],
      ])("%s + arrow declines", (_name, modifier) => {
        const ctx = getContext();
        ctx.luckysheetCellUpdate = [2, 2];
        editFormula("=SUM(");
        const before = cellInput.innerHTML;

        const handled = handleFormulaArrowKey(
          ctx,
          cellInput,
          fxInput,
          new KeyboardEvent("keydown", { key: "ArrowUp", ...modifier })
        );

        expect(handled).toBe(false);
        expect(cellInput.innerHTML).toBe(before);
        expect(ctx.formulaCache.rangestart).toBeFalsy();
      });
    });

    test("a key that is not an arrow declines", () => {
      const ctx = getContext();
      ctx.luckysheetCellUpdate = [2, 2];
      editFormula("=SUM(");
      const before = cellInput.innerHTML;

      // Both in-repo call sites pre-filter, but the driver is public API.
      const handled = handleFormulaArrowKey(
        ctx,
        cellInput,
        fxInput,
        new KeyboardEvent("keydown", { key: "PageDown" })
      );

      expect(handled).toBe(false);
      expect(cellInput.innerHTML).toBe(before);
    });

    describe("the resolved step is what both callers act on", () => {
      // The formula bar has to cancel the key before its setContext producer
      // can write anything, so it cancels on the resolution and then applies
      // that same resolution. Deciding twice -- gate first, step second --
      // cancelled arrows the step went on to decline, and the caret stopped
      // moving: Left in column A, Up in row 1.
      test.each(["ArrowUp", "ArrowLeft"])(
        "%s from A1 declines, so the arrow keeps its ordinary meaning",
        (key) => {
          const ctx = getContext();
          ctx.luckysheetCellUpdate = [0, 0];
          editFormula("=SUM(");
          const before = cellInput.innerHTML;

          expect(
            resolvePointModeStep(ctx, new KeyboardEvent("keydown", { key }))
          ).toBeNull();
          expect(
            handleFormulaArrowKey(
              ctx,
              cellInput,
              fxInput,
              new KeyboardEvent("keydown", { key })
            )
          ).toBe(false);

          // Nothing written, and the grid leaves the key to the browser so the
          // caret still moves through the text.
          expect(cellInput.innerHTML).toBe(before);
          expect(ctx.formulaCache.rangestart).toBeFalsy();
          expect(pressArrow(ctx, key, cellInput).defaultPrevented).toBe(false);
        }
      );

      test("once point mode is running the edge still belongs to it", () => {
        const ctx = getContext();
        ctx.luckysheetCellUpdate = [1, 0];
        editFormula("=SUM(");

        pressArrow(ctx, "ArrowUp", cellInput);
        expect(cellInput.textContent).toBe("=SUM(A1");

        // A null target rather than a null resolution: there is nowhere left to
        // step, but the key is still point mode's, so it does not walk the
        // caret out of the reference being built.
        expect(
          resolvePointModeStep(
            ctx,
            new KeyboardEvent("keydown", { key: "ArrowUp" })
          )
        ).toEqual({ target: null });
        expect(
          handleFormulaArrowKey(
            ctx,
            cellInput,
            fxInput,
            new KeyboardEvent("keydown", { key: "ArrowUp" })
          )
        ).toBe(true);
        expect(cellInput.textContent).toBe("=SUM(A1");
      });

      test.each(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])(
        "%s declines when the edited cell is not a real index",
        (key) => {
          const ctx = getContext();
          // Type-legal and reachable: luckysheetCellUpdate is any[] and both
          // of its writers assign [row_focus, column_focus] with row_focus
          // optional on the Selection type and no nil check. canEnterPointMode
          // only asks that the array is non-empty, so this seed gets through to
          // the step. Arithmetic on it is NaN, and NaN fails *both* of
          // stepToVisibleIndex's bounds tests -- NaN < 0 and NaN >= limit are
          // each false -- so without an explicit finite test it came back as a
          // valid target and went on to write a reference at row NaN and put
          // the overlay there.
          ctx.luckysheetCellUpdate = [undefined, undefined];
          editFormula("=SUM(");
          const before = cellInput.innerHTML;

          expect(
            resolvePointModeStep(ctx, new KeyboardEvent("keydown", { key }))
          ).toBeNull();
          expect(cellInput.innerHTML).toBe(before);
          expect(ctx.formulaCache.rangestart).toBeFalsy();
        }
      );

      test("applying the same step twice is idempotent", () => {
        const ctx = getContext();
        ctx.luckysheetCellUpdate = [2, 2];
        editFormula("=SUM(");

        // StrictMode invokes the producer twice, and applyPointModeStep writes
        // to the DOM from inside it, so the second pass runs against the markup
        // the first one left. It holds because rangeSetValue consults
        // israngeseleciton itself: after pass one the caret is inside the
        // reference just written, so pass two replaces that reference instead
        // of appending another. Asserted rather than assumed, so a change to
        // that branch fails here instead of doubling every picked reference.
        const step = resolvePointModeStep(
          ctx,
          new KeyboardEvent("keydown", { key: "ArrowUp" })
        );

        applyPointModeStep(ctx, cellInput, fxInput, step);
        const afterFirst = cellInput.textContent;
        applyPointModeStep(ctx, cellInput, fxInput, step);

        expect(afterFirst).toBe("=SUM(C2");
        expect(cellInput.textContent).toBe("=SUM(C2");
        expect(
          cellInput.querySelectorAll("span.fortune-formula-functionrange-cell")
        ).toHaveLength(1);
      });

      test("a resolved target is applied without deciding again", () => {
        const ctx = getContext();
        ctx.luckysheetCellUpdate = [2, 2];
        editFormula("=SUM(");

        // The formula bar's two halves, in order: resolve while the caret is
        // live, apply once the producer runs.
        const step = resolvePointModeStep(
          ctx,
          new KeyboardEvent("keydown", { key: "ArrowUp" })
        );
        expect(step).toEqual({ target: { row: 1, column: 2 } });

        applyPointModeStep(ctx, cellInput, fxInput, step);

        expect(cellInput.textContent).toBe("=SUM(C2");
        expect(ctx.formulaCache.rangestart).toBe(true);
      });
    });
  });
});
