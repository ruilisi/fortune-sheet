import React from "react";
import defaultContext, { Context } from "@fortune-sheet/core/src/context";

const WorkbookContext = React.createContext<{
  context: Context;
  setContext: React.Dispatch<React.SetStateAction<Context>>;
}>({
  context: defaultContext(),
  setContext: () => {},
});

export default WorkbookContext;
