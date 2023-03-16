import { createFilterOptions, getSheetIndex } from "@fortune-sheet/core";
import _ from "lodash";
import React, { useCallback, useContext, useEffect } from "react";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";

const FilterOptions: React.FC<{ getContainer: () => HTMLDivElement }> = ({
  getContainer,
}) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const {
    filterOptions,
    currentSheetId,
    filter,
    visibledatarow,
    visibledatacolumn,
  } = context;
  const sheetIndex = getSheetIndex(context, context.currentSheetId);
  const { filter_select } = context.luckysheetfile[sheetIndex!];

  useEffect(() => {
    setContext((draftCtx) => {
      const sheetIdx = getSheetIndex(draftCtx, draftCtx.currentSheetId);
      if (sheetIdx == null) return;
      draftCtx.luckysheet_filter_save =
        draftCtx.luckysheetfile[sheetIdx].filter_select;
      draftCtx.filter = draftCtx.luckysheetfile[sheetIdx].filter || {};
      createFilterOptions(draftCtx, draftCtx.luckysheet_filter_save, undefined);
    });
  }, [
    visibledatarow,
    visibledatacolumn,
    setContext,
    currentSheetId,
    filter_select,
  ]);

  const showFilterContextMenu = useCallback(
    (
      v: {
        col: number;
        left: number;
        top: number;
      },
      i: number
    ) => {
      if (filterOptions == null) return;
      setContext((draftCtx) => {
        const container = getContainer();
        const workbookRect =
          refs.workbookContainer.current!.getBoundingClientRect();
        if (draftCtx.filterContextMenu?.col === filterOptions.startCol + i)
          return;
        draftCtx.filterContextMenu = {
          x:
            v.left +
            draftCtx.rowHeaderWidth -
            refs.scrollbarX.current!.scrollLeft +
            workbookRect.x,
          y:
            v.top +
            20 +
            container.getBoundingClientRect().y +
            draftCtx.columnHeaderHeight -
            refs.scrollbarY.current!.scrollTop +
            workbookRect.y,
          col: filterOptions.startCol + i,
          startRow: filterOptions.startRow,
          endRow: filterOptions.endRow,
          startCol: filterOptions.startCol,
          endCol: filterOptions.endCol,
          hiddenRows: _.keys(draftCtx.filter[i]?.rowhidden).map((r) =>
            parseInt(r, 10)
          ),
          listBoxMaxHeight: 400,
        };
      });
    },
    [
      filterOptions,
      getContainer,
      refs.scrollbarX,
      refs.scrollbarY,
      refs.workbookContainer,
      setContext,
    ]
  );

  return filterOptions == null ? (
    <div />
  ) : (
    <>
      <div
        id="luckysheet-filter-selected-sheet"
        className="luckysheet-cell-selected luckysheet-filter-selected"
        style={{
          left: filterOptions.left,
          width: filterOptions.width,
          top: filterOptions.top,
          height: filterOptions.height,
          display: "block",
        }}
      />
      {filterOptions.items.map((v, i) => {
        const filterParam = filter[i];
        return (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              showFilterContextMenu(v, i);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            key={i}
            style={{ left: v.left, top: v.top }}
            className={`luckysheet-filter-options ${
              filterParam == null ? "" : "luckysheet-filter-options-active"
            }`}
          >
            {filterParam == null ? (
              <div className="caret down" />
            ) : (
              <SVGIcon
                name="filter-fill-white"
                style={{ width: 15, height: 15 }}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

export default FilterOptions;
