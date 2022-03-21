import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook } from "@fortune-sheet/react/src";
import cell from "./data/cell";
import formula from "./data/formula";
import empty from "./data/empty";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const Template: ComponentStory<typeof Workbook> = (args) => (
  <div style={{ width: "100%", height: "100%" }}>
    <Workbook {...args} />
  </div>
);

export const Basic = Template.bind({});
Basic.args = { data: [cell] };

export const Formula = Template.bind({});
Formula.args = { data: [formula] };

export const Empty = Template.bind({});
Empty.args = { data: [empty] };

export const All = Template.bind({});
All.args = { data: [cell, formula] };
