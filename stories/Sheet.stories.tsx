import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Sheet } from "@fortune-sheet/react/src";

export default {
  component: Sheet,
} as ComponentMeta<typeof Sheet>;

const Template: ComponentStory<typeof Sheet> = (args) => <Sheet {...args} />;

export const Basic = Template.bind({});
Basic.args = {};
