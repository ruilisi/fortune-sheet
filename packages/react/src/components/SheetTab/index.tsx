import _ from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  updateCell,
  addSheet,
  locale,
  calcSelectionInfo,
} from "@fortune-sheet/core";
// @ts-ignore
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";
import SheetItem from "./SheetItem";

const SheetTab: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const { formula } = locale(context);
  const [sheetScrollAni, setSheetScrollAni] = useState<any>(null);
  const [sheetScrollStep] = useState<number>(150);
  const [isShowScrollBtn, setIsShowScrollBtn] = useState<boolean>(false);
  const [isShowBoundary, setIsShowBoundary] = useState<boolean>(true);
  const [calInfo, setCalInfo] = useState<{
    numberC: number;
    count: number;
    sum: number;
    max: number;
    min: number;
    average: string;
  }>({
    numberC: 0,
    count: 0,
    sum: 0,
    max: 0,
    min: 0,
    average: "",
  });

  const scrollToLeft = useCallback(
    (moveType: string) => {
      if (
        tabContainerRef.current == null ||
        tabContainerRef.current.scrollLeft == null
      )
        return;
      if (moveType === "left") {
        const scrollLeft = tabContainerRef.current.scrollLeft as number;
        let sheetScrollStart = scrollLeft;
        const sheetScrollEnd = scrollLeft - sheetScrollStep;

        if (sheetScrollEnd <= 0) setIsShowBoundary(true);
        clearInterval(sheetScrollAni);
        setSheetScrollAni((ani: any) => {
          ani = setInterval(() => {
            sheetScrollStart -= 4;
            tabContainerRef.current!.scrollLeft = sheetScrollStart;
            if (sheetScrollStart <= sheetScrollEnd) {
              clearInterval(ani);
            }
          }, 1);
          return ani;
        });
      } else if (moveType === "right") {
        const scrollLeft = tabContainerRef.current.scrollLeft as number;
        let sheetScrollStart = scrollLeft;
        const sheetScrollEnd = scrollLeft + sheetScrollStep;
        if (sheetScrollStart > 0) setIsShowBoundary(false);
        clearInterval(sheetScrollAni);
        setSheetScrollAni((ani: any) => {
          ani = setInterval(() => {
            sheetScrollStart += 4;
            tabContainerRef.current!.scrollLeft = sheetScrollStart;
            if (sheetScrollStart >= sheetScrollEnd) {
              clearInterval(ani);
            }
          }, 1);
          return ani;
        });
      }
    },
    [sheetScrollAni, sheetScrollStep]
  );

  useEffect(() => {
    const tabCurrent = tabContainerRef.current;
    setIsShowScrollBtn(tabCurrent!.scrollWidth - 2 > tabCurrent!.clientWidth);
  }, [context.luckysheetfile]);

  // 计算选区的信息
  useEffect(() => {
    const selection = context.luckysheet_select_save;
    if (selection) {
      const re = calcSelectionInfo(context);
      setCalInfo(re);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheet_select_save]);

  return (
    <div
      className="luckysheet-sheet-area luckysheet-noselected-text"
      onContextMenu={(e) => e.preventDefault()}
      id="luckysheet-sheet-area"
    >
      <div id="luckysheet-sheet-content">
        {context.allowEdit && (
          <div
            className="fortune-sheettab-button"
            onClick={() => {
              _.debounce(() => {
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheetCellUpdate.length > 0) {
                      updateCell(
                        draftCtx,
                        draftCtx.luckysheetCellUpdate[0],
                        draftCtx.luckysheetCellUpdate[1],
                        refs.cellInput.current!
                      );
                    }
                    addSheet(draftCtx, settings);
                  },
                  { addSheetOp: true }
                );
              }, 300)();
              const tabCurrent = tabContainerRef.current;
              setIsShowScrollBtn(
                tabCurrent!.scrollWidth > tabCurrent!.clientWidth
              );
            }}
          >
            <SVGIcon name="plus" width={16} height={16} />
          </div>
        )}
        {context.allowEdit && (
          <div className="sheet-list-container">
            <div
              id="all-sheets"
              className="fortune-sheettab-button"
              ref={tabContainerRef}
              onMouseDown={(e) => {
                e.stopPropagation();
                setContext((ctx) => {
                  ctx.showSheetList = _.isUndefined(ctx.showSheetList)
                    ? true
                    : !ctx.showSheetList;
                  ctx.sheetTabContextMenu = {};
                });
              }}
            >
              <SVGIcon name="all-sheets" width={16} height={16} />
            </div>
          </div>
        )}
        <div
          id="luckysheet-sheets-m"
          className="luckysheet-sheets-m lucky-button-custom"
        >
          <i className="iconfont luckysheet-iconfont-caidan2" />
        </div>
        <div
          className="fortune-sheettab-container"
          id="fortune-sheettab-container"
        >
          {!isShowBoundary && <div className="boundary boundary-left" />}
          <div
            className="fortune-sheettab-container-c"
            id="fortune-sheettab-container-c"
            ref={tabContainerRef}
          >
            {_.sortBy(context.luckysheetfile, (s) => Number(s.order)).map(
              (sheet) => {
                return <SheetItem key={sheet.id} sheet={sheet} />;
              }
            )}
            {/* <SheetItem
              isDropPlaceholder
              sheet={{ name: "", id: "drop-placeholder" }}
            /> */}
          </div>
          {isShowBoundary && isShowScrollBtn && (
            <div className="boundary boundary-right" />
          )}
        </div>
        {isShowScrollBtn && (
          <div
            id="fortune-sheettab-leftscroll"
            className="fortune-sheettab-scroll"
            ref={leftScrollRef}
            onClick={() => {
              // tabContainerRef.current!.scrollLeft -= 150;
              scrollToLeft("left");
            }}
          >
            <SVGIcon name="arrow-doubleleft" width={12} height={12} />
          </div>
        )}
        {isShowScrollBtn && (
          <div
            id="fortune-sheettab-rightscroll"
            className="fortune-sheettab-scroll"
            ref={rightScrollRef}
            onClick={() => {
              // tabContainerRef.current!.scrollLeft += 150;
              scrollToLeft("right");
            }}
          >
            <SVGIcon name="arrow-doubleright" width={12} height={12} />
          </div>
        )}
        <div className="luckysheet-sheet-selection-calInfo">
          {!!calInfo.count && (
            <div style={{ width: "60px" }}>
              {formula.count}: {calInfo.count}
            </div>
          )}
          {!!calInfo.numberC && !!calInfo.sum && (
            <div>
              {formula.sum}: {calInfo.sum}
            </div>
          )}
          {!!calInfo.numberC && !!calInfo.average && (
            <div>
              {formula.average}: {calInfo.average}
            </div>
          )}
          {!!calInfo.numberC && !!calInfo.max && (
            <div>
              {formula.max}: {calInfo.max}
            </div>
          )}
          {!!calInfo.numberC && !!calInfo.min && (
            <div>
              {formula.min}: {calInfo.min}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SheetTab;
