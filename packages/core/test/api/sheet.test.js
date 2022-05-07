import { contextFactory, selectionFactory } from "../factories/context";
import { getAllSheets } from "../../src/api/sheet";

describe("sheet", () => {
  const getContext = () =>
    contextFactory({
      luckysheet_select_save: selectionFactory([0, 0], [0, 0], 0, 0),
    });
  test("getAllSheets", () => {
    const ctx = getContext();
    expect(getAllSheets(ctx).length).toBe(2);
    expect(getAllSheets(ctx)).toMatchObject([{ id: "id_1" }, { id: "id_2" }]);
  });
});
