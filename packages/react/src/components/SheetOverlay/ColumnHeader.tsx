import {
  colLocation,
  colLocationByIndex,
  selectTitlesMap,
  selectTitlesRange,
  handleColSizeHandleMouseDown,
  handleColumnHeaderMouseDown,
  handleContextMenu,
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
import SVGIcon from "../SVGIcon";

const ColumnHeader: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const colChangeSizeRef = useRef<HTMLDivElement>(null);
  const [hoverLocation, setHoverLocation] = useState({
    col: -1,
    col_pre: -1,
  });
  const [selectedLocation, setSelectedLocation] = useState<
    { col: number; col_pre: number }[]
  >([]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (context.luckysheet_cols_change_size) {
        return;
      }
      const x =
        e.pageX -
        containerRef.current!.getBoundingClientRect().left +
        containerRef.current!.scrollLeft;
      const col_location = colLocation(x, context.visibledatacolumn);
      const [col_pre, col] = col_location;
      if (col_pre !== hoverLocation.col_pre || col !== hoverLocation.col) {
        setHoverLocation({ col_pre, col });
      }
    },
    [
      context.luckysheet_cols_change_size,
      context.visibledatacolumn,
      hoverLocation.col,
      hoverLocation.col_pre,
    ]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleColumnHeaderMouseDown(
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
    if (context.luckysheet_cols_change_size) {
      return;
    }
    setHoverLocation({ col: -1, col_pre: -1 });
  }, [context.luckysheet_cols_change_size]);

  const onColSizeHandleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleColSizeHandleMouseDown(
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
          "columnHeader"
        );
      });
    },
    [refs.workbookContainer, setContext, settings, refs.cellArea]
  );

  useEffect(() => {
    const s = context.luckysheet_select_save;
    if (_.isNil(s)) return;

    let columnTitleMap = {};
    for (let i = 0; i < s.length; i += 1) {
      const c1 = s[i].column[0];
      const c2 = s[i].column[1];
      columnTitleMap = selectTitlesMap(columnTitleMap, c1, c2);
    }
    const columnTitleRange = selectTitlesRange(columnTitleMap);
    const selects: { col: number; col_pre: number }[] = [];
    for (let j = 0; j < columnTitleRange.length; j += 1) {
      const c1 = columnTitleRange[j][0];
      const c2 = columnTitleRange[j][columnTitleRange[j].length - 1];
      const col = colLocationByIndex(c2, context.visibledatacolumn)[1];
      const col_pre = colLocationByIndex(c1, context.visibledatacolumn)[0];
      if (_.isNumber(col) && _.isNumber(col_pre)) {
        selects.push({ col, col_pre });
      }
    }
    setSelectedLocation(selects);
  }, [context.luckysheet_select_save, context.visibledatacolumn]);

  useEffect(() => {
    containerRef.current!.scrollLeft = context.scrollLeft;
  }, [context.scrollLeft]);

  return (
    <div
      ref={containerRef}
      className="fortune-col-header"
      style={{
        height: context.columnHeaderHeight - 1.5,
      }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      <div
        className="fortune-cols-change-size"
        ref={colChangeSizeRef}
        id="fortune-cols-change-size"
        onMouseDown={onColSizeHandleMouseDown}
        style={{
          left: hoverLocation.col - 5,
          opacity: context.luckysheet_cols_change_size ? 1 : 0,
        }}
      />
      {!context.luckysheet_cols_change_size &&
      hoverLocation.col >= 0 &&
      hoverLocation.col_pre >= 0 ? (
        <div
          className="fortune-col-header-hover"
          style={{
            left: hoverLocation.col_pre,
            width: hoverLocation.col - hoverLocation.col_pre - 1,
            display: "block",
          }}
        >
          <span
            className="header-arrow"
            onClick={(e) => {
              setContext((ctx) => {
                ctx.contextMenu = {
                  x: e.pageX,
                  y: 90,
                  headerMenu: true,
                };
              });
            }}
          >
            <SVGIcon name="headDownArrow" width={12} />
          </span>
        </div>
      ) : null}
      {selectedLocation.map(({ col, col_pre }, i) => (
        <div
          className="fortune-col-header-selected"
          key={i}
          style={{
            left: col_pre,
            width: col - col_pre - 1,
            display: "block",
            backgroundColor: "rgba(76, 76, 76, 0.1)",
          }}
        />
      ))}
      {/* placeholder to overflow the container, making the container scrollable */}
      <div
        className="luckysheet-cols-h-cells luckysheetsheetchange"
        id="luckysheet-cols-h-cells_0"
        style={{ width: context.ch_width, height: 1 }}
      >
        <div className="luckysheet-cols-h-cells-c">
          <div className="luckysheet-grdblkpush" />
        </div>
      </div>
    </div>
  );
};

export default ColumnHeader;
