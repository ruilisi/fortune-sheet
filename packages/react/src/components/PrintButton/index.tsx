import React, { useContext } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import WorkbookContext, { IWorkbookContext } from "../../context";
import Button from "../Toolbar/Button";
import { PrintContainer } from "./PrintContainer";

const containerId = "fortunPrintContainer";
const { print: originPrint } = window;

async function printImage(context: IWorkbookContext) {
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
      <WorkbookContext.Provider value={context}>
        <PrintContainer
          onSuccess={() => {
            resolve(undefined);
          }}
        />
      </WorkbookContext.Provider>
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
        printImage(workbookContext);
      }}
    />
  );
};
