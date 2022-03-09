import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Workbook } from "@fortune-sheet/react/src";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const data: any = [];
for (let i = 0; i < 100; i += 1) {
  data.push([]);
  for (let j = 0; j < 100; j += 1) {
    if ((j + i) % 2 === 0) {
      data[i].push(null);
    } else {
      data[i].push({
        ct: {
          fa: "General",
          t: "g",
        },
        m: "haha",
        v: "haha",
      });
    }
  }
}

const Template: ComponentStory<typeof Workbook> = (args) => (
  <div style={{ width: 1000, height: 800 }}>
    <Workbook {...args} data={data} />
  </div>
);

export const Basic = Template.bind({});
Basic.args = {};
