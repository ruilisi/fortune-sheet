import { createFilterOptions, getSheetIndex } from "@fortune-sheet/core";
import _ from "lodash";
import React, { useCallback, useContext, useMemo, useEffect } from "react";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";

const FilterOptions: React.FC<{ getContainer: () => HTMLDivElement }> = ({
  getContainer,
}) => {
  const {
    context: {
      filterOptions,
      currentSheetId,
      filter,
      visibledatarow,
      visibledatacolumn,
    },
    setContext,
    refs,
  } = useContext(WorkbookContext);
  const currentOptions = useMemo(
    () => filterOptions?.[currentSheetId],
    [filterOptions, currentSheetId]
  );

  useEffect(() => {
    setContext((draftCtx) => {
      const sheetIndex = getSheetIndex(draftCtx, draftCtx.currentSheetId);
      if (sheetIndex == null) return;
      draftCtx.luckysheet_filter_save =
        draftCtx.luckysheetfile[sheetIndex].filter_select;
      draftCtx.filter = draftCtx.luckysheetfile[sheetIndex].filter || {};
      createFilterOptions(draftCtx, draftCtx.luckysheet_filter_save);
    });
  }, [visibledatarow, visibledatacolumn, setContext, currentSheetId]);

  const showFilterContextMenu = useCallback(
    (
      v: {
        col: number;
        left: number;
        top: number;
      },
      i: number
    ) => {
      if (currentOptions == null) return;
      setContext((draftCtx) => {
        const container = getContainer();
        if (draftCtx.filterContextMenu?.col === currentOptions.startCol + i)
          return;
        draftCtx.filterContextMenu = {
          x:
            v.left +
            draftCtx.rowHeaderWidth -
            refs.scrollbarX.current!.scrollLeft,
          y:
            v.top +
            20 +
            container.getBoundingClientRect().y +
            draftCtx.columnHeaderHeight -
            refs.scrollbarY.current!.scrollTop,
          col: currentOptions.startCol + i,
          startRow: currentOptions.startRow,
          endRow: currentOptions.endRow,
          startCol: currentOptions.startCol,
          endCol: currentOptions.endCol,
          hiddenRows: _.keys(draftCtx.filter[i]?.rowhidden).map((r) =>
            parseInt(r, 10)
          ),
          listBoxMaxHeight: 400,
        };
      });
    },
    [currentOptions, getContainer, refs.scrollbarX, refs.scrollbarY, setContext]
  );

  return currentOptions == null ? (
    <div />
  ) : (
    <>
      <div
        id="luckysheet-filter-selected-sheet"
        className="luckysheet-cell-selected luckysheet-filter-selected"
        style={{
          left: currentOptions.left,
          width: currentOptions.width,
          top: currentOptions.top,
          height: currentOptions.height,
          display: "block",
        }}
      />
      {currentOptions.items.map((v, i) => {
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
