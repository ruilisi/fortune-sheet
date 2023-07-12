import {
  Context,
  Settings,
  api,
  handleScreenShotByRange,
  loadSheetById,
} from "@fortune-sheet/core";
import produce from "immer";
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { PrintPageRange, computePrintPage, getCellRange } from "./divider";

export const PrintContext = React.createContext<{
  context: Context;
  settings: Required<Settings>;
}>({} as any);

const PageContainer = ({ pageInfo }: { pageInfo: PrintPageRange }) => {
  const { context } = useContext(PrintContext);
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");
  useLayoutEffect(() => {
    (async function loadImage() {
      try {
        const imgsrc = await handleScreenShotByRange(context, {
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

export const SheetContainer = ({ sheetId }: { sheetId: string }) => {
  const { context, settings } = useContext(PrintContext);
  const newContext = useMemo(() => {
    return produce(context, (draftContext) => {
      draftContext.currentSheetId = sheetId;
      loadSheetById(draftContext, sheetId, settings);
      draftContext.showGridLines = false;
    });
  }, [context, settings, sheetId]);

  const { printPages } = useMemo(() => {
    const range = getCellRange(newContext, newContext.currentSheetId, {
      type: "value",
    });

    return computePrintPage(newContext, range);
  }, [newContext]);

  return (
    <PrintContext.Provider
      value={useMemo(
        () => ({ settings, context: newContext }),
        [newContext, settings]
      )}
    >
      {printPages.map((page, index) => {
        return <PageContainer pageInfo={page} key={index} />;
      })}
    </PrintContext.Provider>
  );
};

export interface PrintOptions {
  sheetIds?: string[];
}

export const PrintContainer = ({
  onSuccess,
  options,
}: {
  onSuccess: () => void;
  options: PrintOptions;
}) => {
  const { context } = useContext(PrintContext);
  const sheets = api.getAllSheets(context);

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
      {sheets.map((sheet) => {
        if (!sheet.id) {
          return null;
        }
        if (options.sheetIds) {
          if (!options.sheetIds.includes(sheet.id)) {
            return null;
          }
        }
        return <SheetContainer sheetId={sheet.id} key={sheet.id} />;
      })}
    </>
  );
};
