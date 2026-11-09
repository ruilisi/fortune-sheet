import { render } from "@testing-library/react";
import React from "react";
import Workbook from "../src/components/Workbook";

const payload = "<img src=x onerror=alert(1)>";

const renderWithA1 = (cell: Record<string, unknown>) =>
  render(
    <Workbook
      data={[{ name: "Sheet1", celldata: [{ r: 0, c: 0, v: cell }] }]}
    />
  );

describe("formula bar", () => {
  it.each([
    ["a formula", { f: `="${payload}"`, v: "" }],
    ["a value starting with =", { v: `=${payload}`, m: `=${payload}` }],
    [
      "a value starting with <span",
      { v: `<span>${payload}`, m: `<span>${payload}` },
    ],
    [
      "an inline string",
      { ct: { t: "inlineStr", s: [{ v: `<span>${payload}` }] } },
    ],
  ])("renders %s as text", (_, cell) => {
    const { container } = renderWithA1(cell);
    const fxInput = container.querySelector(".fortune-fx-input");
    expect(fxInput).toBeTruthy();
    expect(fxInput!.querySelector("img")).toBeNull();
    expect(fxInput!.textContent).toContain(payload);
  });
});
