import {
  rowLocation,
  rowLocationByIndex,
} from "@fortune-sheet/core/src/modules/location";
import {
  selectTitlesMap,
  selectTitlesRange,
} from "@fortune-sheet/core/src/modules/selection";
import _ from "lodash";
import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import produce from "immer";
import WorkbookContext from "../../context";
import { handleRowHeaderMouseDown } from "@fortune-sheet/core/src/events/mouse";

const RowHeader: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverLocation, setHoverLocation] = useState({
    row: -1,
    row_pre: -1,
  });
  const [selectedLocation, setSelectedLocation] = useState<
    { row: number; row_pre: number }[]
  >([]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      const y = e.nativeEvent.offsetY + containerRef.current!.scrollTop;
      const row_location = rowLocation(y, context.visibledatarow);
      const [row_pre, row] = row_location;
      setHoverLocation({ row_pre, row });
    },
    [context]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setContext(
        produce((draftCtx) => {
          handleRowHeaderMouseDown(draftCtx, e.nativeEvent, e.currentTarget);
        })
      );
    },
    [setContext]
  );

  useEffect(() => {
    const s = context.luckysheet_select_save || [];
    let rowTitleMap: Record<number, number> = {};
    for (let i = 0; i < s.length; i += 1) {
      const r1 = s[i].row[0];
      const r2 = s[i].row[1];
      rowTitleMap = selectTitlesMap(rowTitleMap, r1, r2);
    }
    const rowTitleRange = selectTitlesRange(rowTitleMap);
    const selects: { row: number; row_pre: number }[] = [];
    for (let i = 0; i < rowTitleRange.length; i += 1) {
      const r1 = rowTitleRange[i][0];
      const r2 = rowTitleRange[i][rowTitleRange[i].length - 1];
      const row = rowLocationByIndex(r2, context.visibledatarow)[1];
      const row_pre = rowLocationByIndex(r1, context.visibledatarow)[0];
      if (_.isNumber(row_pre) && _.isNumber(row)) {
        selects.push({ row, row_pre });
      }
    }
    setSelectedLocation(selects);
  }, [context.luckysheet_select_save, context.visibledatarow]);

  useEffect(() => {
    containerRef.current!.scrollTop = context.scrollTop;
  }, [context.scrollTop]);

  return (
    <div
      ref={containerRef}
      className="fortune-row-header"
      style={{
        width: context.rowHeaderWidth - 1.5,
        height: context.cellmainHeight,
      }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
    >
      {hoverLocation.row >= 0 && hoverLocation.row_pre >= 0 ? (
        <div
          className="fortune-row-header-hover"
          style={{
            top: hoverLocation.row_pre,
            height: hoverLocation.row - hoverLocation.row_pre - 1,
            display: "block",
          }}
        />
      ) : null}
      {selectedLocation.map(({ row, row_pre }, i) => (
        <div
          className="fortune-row-header-selected"
          key={i}
          style={{
            top: row_pre,
            height: row - row_pre - 1,
            display: "block",
            backgroundColor: "rgba(76, 76, 76, 0.1)",
          }}
        />
      ))}
      {/* placeholder to overflow the container, making the container scrollable */}
      <div
        style={{ height: context.rh_height, width: 1 }}
        id="luckysheetrowHeader_0"
        className="luckysheetsheetchange"
      />
    </div>
  );
};

export default RowHeader;
