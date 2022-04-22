import { handleBorder } from "../toolbar";

const BorderAllType = {
  currentSheetIndex: "0",
  config: {
    borderInfo: null,
  },
  luckysheetfile: [
    {
      index: "0",
      data: [
        [null, null],
        [null, null],
      ],
    },
  ],
};
describe("BorderStyles", () => {
  it("border-top", async () => {
    handleBorder(BorderAllType, "border-top");
    expect(BorderAllType.config.borderInfo[0].borderType).toEqual("border-top");
  });
  it("border-bottom", async () => {
    handleBorder(BorderAllType, "border-bottom");
    expect(BorderAllType.config.borderInfo[1].borderType).toEqual(
      "border-bottom"
    );
  });
  it("border-left", async () => {
    handleBorder(BorderAllType, "border-left");
    expect(BorderAllType.config.borderInfo[2].borderType).toEqual(
      "border-left"
    );
  });
  it("border-right", async () => {
    handleBorder(BorderAllType, "border-right");
    expect(BorderAllType.config.borderInfo[3].borderType).toEqual(
      "border-right"
    );
  });
  it("border-none", async () => {
    handleBorder(BorderAllType, "border-none");
    expect(BorderAllType.config.borderInfo[4].borderType).toEqual(
      "border-none"
    );
  });
  it("border-all", async () => {
    handleBorder(BorderAllType, "border-all");
    expect(BorderAllType.config.borderInfo[5].borderType).toEqual("border-all");
  });
  it("border-outside", async () => {
    handleBorder(BorderAllType, "border-none");
    handleBorder(BorderAllType, "border-outside");
    expect(BorderAllType.config.borderInfo[7].borderType).toEqual(
      "border-outside"
    );
  });
  it("border-inside", async () => {
    handleBorder(BorderAllType, "border-inside");
    expect(BorderAllType.config.borderInfo[8].borderType).toEqual(
      "border-inside"
    );
  });
  it("border-horizontal", async () => {
    handleBorder(BorderAllType, "border-none");
    handleBorder(BorderAllType, "border-horizontal");
    expect(BorderAllType.config.borderInfo[10].borderType).toEqual(
      "border-horizontal"
    );
  });
  it("border-vertical", async () => {
    handleBorder(BorderAllType, "border-vertical");
    expect(BorderAllType.config.borderInfo[11].borderType).toEqual(
      "border-vertical"
    );
  });
});
