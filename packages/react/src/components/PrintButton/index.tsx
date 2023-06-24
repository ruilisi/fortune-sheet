import React, { useContext, useRef } from "react";
import { handleScreenShot } from "@fortune-sheet/core";
import "./index.css";
import WorkbookContext from "../../context";
import Button from "../Toolbar/Button";

const containerId = "fortunPrintContainer";
const { print: originPrint } = window;

function factoryImgEle(imgsrc: string) {
  const img = document.createElement("img");
  img.setAttribute("src", imgsrc);
  return img;
}

function printImage(images: string[]) {
  const printElement = document.createElement("div");
  printElement.setAttribute("id", containerId);
  document.body.appendChild(printElement);
  document.body.setAttribute("data-fortuneprinting", "true");
  images.forEach((src) => {
    printElement.appendChild(factoryImgEle(src));
  });
  originPrint();
}

export const PrintButton = () => {
  const { context } = useContext(WorkbookContext);
  const contextRef = useRef(context);
  return (
    <Button
      iconId="print"
      tooltip="打印"
      key="print"
      onClick={() => {
        const imgsrc = handleScreenShot(contextRef.current, {
          noDefaultBorder: true,
        });
        if (imgsrc) {
          printImage([imgsrc]);
        }
      }}
    />
  );
};
