import { handleBorder } from "../../src/modules/toolbar";

const context = {
  currentSheetId: "0",
  config: {},
  luckysheetfile: [
    {
      id: "0",
      data: [
        [null, null],
        [null, null],
      ],
    },
  ],
};

describe("border", () => {
  it("border-top", async () => {
    handleBorder(context, "border-top");
    expect(context.luckysheetfile[0].config.borderInfo[0].borderType).toEqual(
      "border-top"
    );
  });

  it("border-bottom", async () => {
    handleBorder(context, "border-bottom");
    expect(context.luckysheetfile[0].config.borderInfo[1].borderType).toEqual(
      "border-bottom"
    );
  });

  it("border-left", async () => {
    handleBorder(context, "border-left");
    expect(context.luckysheetfile[0].config.borderInfo[2].borderType).toEqual(
      "border-left"
    );
  });

  it("border-right", async () => {
    handleBorder(context, "border-right");
    expect(context.luckysheetfile[0].config.borderInfo[3].borderType).toEqual(
      "border-right"
    );
  });

  it("border-none", async () => {
    handleBorder(context, "border-none");
    expect(context.luckysheetfile[0].config.borderInfo[4].borderType).toEqual(
      "border-none"
    );
  });

  it("border-all", async () => {
    handleBorder(context, "border-all");
    expect(context.luckysheetfile[0].config.borderInfo[5].borderType).toEqual(
      "border-all"
    );
  });

  it("border-outside", async () => {
    handleBorder(context, "border-none");
    handleBorder(context, "border-outside");
    expect(context.luckysheetfile[0].config.borderInfo[7].borderType).toEqual(
      "border-outside"
    );
  });

  it("border-inside", async () => {
    handleBorder(context, "border-inside");
    expect(context.luckysheetfile[0].config.borderInfo[8].borderType).toEqual(
      "border-inside"
    );
  });

  it("border-horizontal", async () => {
    handleBorder(context, "border-none");
    handleBorder(context, "border-horizontal");
    expect(context.luckysheetfile[0].config.borderInfo[10].borderType).toEqual(
      "border-horizontal"
    );
  });

  it("border-vertical", async () => {
    handleBorder(context, "border-vertical");
    expect(context.luckysheetfile[0].config.borderInfo[11].borderType).toEqual(
      "border-vertical"
    );
  });
});
