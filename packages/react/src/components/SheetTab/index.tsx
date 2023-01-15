import _ from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { updateCell, addSheet, locale, getFlowdata } from "@fortune-sheet/core";
// @ts-ignore
import SSF from "@fortune-sheet/core/src/modules/ssf.js";
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
  const [numberCount, setNumberCount] = useState<number>(0);
  const [showCalInfo, setShowCalInfo] = useState<boolean>(false);
  const [countInfo, setCountInfo] = useState<string | undefined>(undefined);
  const [sumInfo, setSumInfo] = useState<string | undefined>(undefined);
  const [averageInfo, setAverageInfo] = useState<string | undefined>(undefined);
  const [maxInfo, setMaxInfo] = useState<string | undefined>(undefined);
  const [minInfo, setMinInfo] = useState<string | undefined>(undefined);

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
    setIsShowScrollBtn(tabCurrent!.scrollWidth > tabCurrent!.clientWidth);
  }, [context.luckysheetfile]);

  // 计算选区的信息
  useEffect(() => {
    const selection = context.luckysheet_select_save;
    if (selection) {
      const data = getFlowdata(context, context.currentSheetId);
      if (data == null) return;
      const row = selection[0].row ?? [];
      const column = selection[0].column ?? [];
      if (row[0] !== row[1] || column[0] !== column[1]) {
        let numberC = 0;
        let count = 0;
        let sum = 0;
        let max = Number.MIN_VALUE;
        let min = Number.MAX_VALUE;
        for (let r = row[0]; r <= row[1]; r += 1) {
          for (let c = column[0]; c <= column[1]; c += 1) {
            if (r >= data.length || c >= data[0].length) break;
            const value = data![r][c]?.m as string;
            // 判断是不是数字
            if (parseFloat(value).toString() !== "NaN") {
              const valueNumber = parseFloat(value);
              count += 1;
              sum += valueNumber;
              max = Math.max(valueNumber, max);
              min = Math.min(valueNumber, min);
              numberC += 1;
            } else if (value != null) {
              count += 1;
            }
          }
        }
        const average = SSF.format("w0.00", sum / numberC);
        sum = SSF.format("w0.00", sum);
        max = SSF.format("w0.00", max === Number.MIN_VALUE ? 0 : max);
        min = SSF.format("w0.00", min === Number.MAX_VALUE ? 0 : min);
        setCountInfo(count.toString());
        setSumInfo(sum.toString());
        setAverageInfo(average.toString());
        setMaxInfo(max.toString());
        setMinInfo(min.toString());
        setShowCalInfo(true);
        setNumberCount(numberC);
      } else {
        setCountInfo(undefined);
        setSumInfo(undefined);
        setAverageInfo(undefined);
        setMaxInfo(undefined);
        setMinInfo(undefined);
        setShowCalInfo(false);
        setNumberCount(0);
      }
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
        {showCalInfo && (
          <div className="luckysheet-sheet-selection-calInfo">
            {!!countInfo && (
              <div style={{ width: "60px" }}>
                {formula.count}: {countInfo}
              </div>
            )}
            {!!numberCount && !!sumInfo && (
              <div>
                {formula.sum}: {sumInfo}
              </div>
            )}
            {!!numberCount && !!averageInfo && (
              <div>
                {formula.average}: {averageInfo}
              </div>
            )}
            {!!numberCount && !!maxInfo && (
              <div>
                {formula.max}: {maxInfo}
              </div>
            )}
            {!!numberCount && !!minInfo && (
              <div>
                {formula.min}: {minInfo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetTab;
