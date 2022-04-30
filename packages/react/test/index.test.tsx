import { mount } from "enzyme";
import React from "react";
import Workbook from "../src/components/Workbook";
import { waitForComponentToPaint } from "../../../tests/util";

describe("Worksheet", () => {
  it("should render", async () => {
    const wrapper = mount(<Workbook data={[{ name: "Sheet1" }]} />);
    await waitForComponentToPaint(wrapper);
    expect(wrapper.exists(".fortune-sheet-container")).toBeTruthy();
  });
});
