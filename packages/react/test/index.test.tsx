import { render } from "@testing-library/react";
import React from "react";
import Workbook from "../src/components/Workbook";

describe("Worksheet", () => {
  it("should render", async () => {
    const { queryByText, container } = render(
      <Workbook data={[{ name: "Sheet1" }]} />
    );
    expect(container.querySelector(".online-sheet-container")).toBeTruthy();
    expect(queryByText("Sheet1")).toBeTruthy();
  });
});
