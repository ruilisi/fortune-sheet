import { mount } from "enzyme";
import React from "react";
import { Workbook } from "@fortune-sheet/react";
import { waitForComponentToPaint } from "./util";

describe("Worksheet", () => {
  it("should render", async () => {
    const wrapper = mount(<Workbook data={[{ name: "Sheet1" }]} />);
    await waitForComponentToPaint(wrapper);
    expect(wrapper.exists(".fortune-sheet-container")).toBeTruthy();
  });
});
