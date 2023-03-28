import {
  rowLocation,
  rowLocationByIndex,
  selectTitlesMap,
  selectTitlesRange,
  handleContextMenu,
  handleRowHeaderMouseDown,
  handleRowSizeHandleMouseDown,
  getSelectionStyle,
} from "@fortune-sheet/core";
import _ from "lodash";
import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import WorkbookContext from "../../context";

const RowHeader: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const rowChangeSizeRef = useRef<HTMLDivElement>(null);
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
      if (context.luckysheet_rows_change_size) {
        return;
      }
      const y =
        e.pageY -
        containerRef.current!.getBoundingClientRect().top +
        containerRef.current!.scrollTop;
      const row_location = rowLocation(y, context.visibledatarow);
      const [row_pre, row] = row_location;
      if (row_pre !== hoverLocation.row_pre || row !== hoverLocation.row) {
        setHoverLocation({ row_pre, row });
      }
    },
    [
      context.luckysheet_rows_change_size,
      context.visibledatarow,
      hoverLocation.row,
      hoverLocation.row_pre,
    ]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleRowHeaderMouseDown(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          containerRef.current!,
          refs.cellInput.current!,
          refs.fxInput.current!
        );
      });
    },
    [refs.globalCache, refs.cellInput, refs.fxInput, setContext]
  );

  const onMouseLeave = useCallback(() => {
    if (context.luckysheet_rows_change_size) {
      return;
    }
    setHoverLocation({ row: -1, row_pre: -1 });
  }, [context.luckysheet_rows_change_size]);

  const onRowSizeHandleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleRowSizeHandleMouseDown(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          containerRef.current!,
          refs.workbookContainer.current!,
          refs.cellArea.current!
        );
      });
      e.stopPropagation();
    },
    [refs.cellArea, refs.globalCache, refs.workbookContainer, setContext]
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleContextMenu(
          draftCtx,
          settings,
          nativeEvent,
          refs.workbookContainer.current!,
          refs.cellArea.current!,
          "rowHeader"
        );
      });
    },
    [refs.workbookContainer, setContext, settings, refs.cellArea]
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
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      <div
        className="fortune-rows-change-size"
        ref={rowChangeSizeRef}
        onMouseDown={onRowSizeHandleMouseDown}
        style={{
          top: hoverLocation.row - 3,
          opacity: context.luckysheet_rows_change_size ? 1 : 0,
        }}
      />
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
          style={getSelectionStyle(
            context,
            refs.globalCache.freezen?.[context.currentSheetId],
            undefined,
            "row",
            row_pre,
            row - row_pre - 1
          )}
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
