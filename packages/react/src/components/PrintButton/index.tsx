import React, { useContext } from "react";
import { createRoot } from "react-dom/client";

import { Context, Settings } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import Button from "../Toolbar/Button";
import { PrintContainer, PrintContext, PrintOptions } from "./PrintContainer";
import "./index.css";

const containerId = "fortunPrintContainer";
const { print: originPrint } = window;

export async function printExcel(
  context: Context,
  settings: Required<Settings>,
  options: PrintOptions = {}
) {
  let printElement = document.querySelector(`#${containerId}`);
  if (!printElement) {
    printElement = document.createElement("div");
    printElement.setAttribute("id", containerId);
    document.body.appendChild(printElement);
  }
  document.body.setAttribute("data-fortuneprinting", "true");
  const root = createRoot(printElement);

  await new Promise((resolve) => {
    root.render(
      <PrintContext.Provider value={{ context, settings }}>
        <PrintContainer
          options={options}
          onSuccess={() => {
            resolve(undefined);
          }}
        />
      </PrintContext.Provider>
    );
  });

  originPrint();
  document.body.setAttribute("data-fortuneprinting", "false");
}

export const PrintButton = () => {
  const workbookContext = useContext(WorkbookContext);

  return (
    <Button
      iconId="printing-page"
      tooltip="打印"
      key="print"
      onClick={() => {
        printExcel(workbookContext.context, workbookContext.settings);
      }}
    />
  );
};
