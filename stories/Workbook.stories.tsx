import React, { useState, useCallback } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook } from "@fortune-sheet/react/src";
import { Sheet } from "@fortune-sheet/core/src/types";
import cell from "./data/cell";
import formula from "./data/formula";
import empty from "./data/empty";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const Template: ComponentStory<typeof Workbook> = ({
  data: data0,
  ...args
}) => {
  const [data, setData] = useState<Sheet[]>(data0);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook {...args} data={data} onChange={onChange} />
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = { data: [cell] };

export const Formula = Template.bind({});
Formula.args = { data: [formula] };

export const Empty = Template.bind({});
Empty.args = { data: [empty] };

export const All = Template.bind({});
All.args = { data: [cell, formula] };
