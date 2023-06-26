import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { handleScreenShot } from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import { PrintPageRange, computePrintPage, getCellRange } from "./divider";

const PageContainer = ({ pageInfo }: { pageInfo: PrintPageRange }) => {
  const { context } = useContext(WorkbookContext);
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");
  useLayoutEffect(() => {
    (async function loadImage() {
      try {
        const imgsrc = await handleScreenShot(context, {
          noDefaultBorder: true,
          range: pageInfo.range,
        });
        if (imgsrc) {
          setSrc(imgsrc);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [context, pageInfo.range]);

  return (
    <div className="fortune-printed-page">
      {loading ? (
        <div className="fortune-print-img-loading">loading</div>
      ) : null}
      <img style={{ scale: 0.5 }} src={src} hidden={!src} alt="" />
    </div>
  );
};
export const PrintContainer = ({ onSuccess }: { onSuccess: () => void }) => {
  const { context } = useContext(WorkbookContext);
  const range = getCellRange(context, context.currentSheetId, {
    type: "value",
  });

  const { printPages } = computePrintPage(context, range);
  useEffect(() => {
    const timer = setInterval(() => {
      const eles = document.querySelectorAll(".fortune-print-img-loading");
      if (eles.length === 0) {
        onSuccess();
      }
    });
    return () => {
      clearInterval(timer);
    };
  }, [onSuccess]);
  return (
    <>
      {printPages.map((page, index) => {
        return <PageContainer pageInfo={page} key={index} />;
      })}
    </>
  );
};
