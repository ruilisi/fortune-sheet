import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook } from "@fortune-sheet/react/src";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const Template: ComponentStory<typeof Workbook> = (args) => (
  <Workbook {...args} />
);

export const Basic = Template.bind({});
Basic.args = {};
