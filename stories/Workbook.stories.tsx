import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook } from "@fortune-sheet/react/src";
import data from "./data";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const Template: ComponentStory<typeof Workbook> = (args) => (
  <div style={{ width: "100%", height: "100%" }}>
    <Workbook {...args} data={[data]} />
  </div>
);

export const Basic = Template.bind({});
Basic.args = {};
