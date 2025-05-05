import {
  createFilterOptions,
  fixColumnStyleOverflowInFreeze,
  fixRowStyleOverflowInFreeze,
  getSheetIndex,
} from "@mritunjaygoutam12/core-mod";
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
  const { filter_select, frozen } = context.luckysheetfile[sheetIndex!];

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
        if (draftCtx.filterContextMenu?.col === filterOptions.startCol + i)
          return;
        draftCtx.filterContextMenu = {
          x:
            v.left +
            draftCtx.rowHeaderWidth -
            refs.scrollbarX.current!.scrollLeft,
          y:
            v.top +
            23 +
            draftCtx.toolbarHeight +
            draftCtx.calculatebarHeight +
            draftCtx.columnHeaderHeight -
            refs.scrollbarY.current!.scrollTop,
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
    [filterOptions, getContainer, refs.scrollbarX, refs.scrollbarY, setContext]
  );

  const freezeType = frozen?.type;
  let frozenColumns = -1;
  let frozenRows = -1;

  if (freezeType === "row") frozenRows = 0;
  else if (freezeType === "column") frozenColumns = 0;
  else if (freezeType === "both") {
    frozenColumns = 0;
    frozenRows = 0;
  } else {
    frozenColumns = frozen?.range?.column_focus || -1;
    frozenRows = frozen?.range?.row_focus || -1;
  }

  return filterOptions == null ? (
    <div />
  ) : (
    <>
      <div
        id="luckysheet-filter-selected-sheet"
        className="luckysheet-cell-selected luckysheet-filter-selected"
        style={_.assign(
          {
            left: filterOptions.left,
            width: filterOptions.width,
            top: filterOptions.top,
            height: filterOptions.height,
            display: "block",
          },
          fixRowStyleOverflowInFreeze(
            context,
            filterOptions.startRow,
            filterOptions.endRow,
            refs.globalCache.freezen?.[context.currentSheetId]
          ),
          fixColumnStyleOverflowInFreeze(
            context,
            filterOptions.startCol,
            filterOptions.endCol,
            refs.globalCache.freezen?.[context.currentSheetId]
          )
        )}
      />
      {filterOptions.items.map((v, i) => {
        const filterParam = filter[i];
        const columnOverflowFreezeStyle = fixColumnStyleOverflowInFreeze(
          context,
          i + filterOptions.startCol,
          i + filterOptions.startCol,
          refs.globalCache.freezen?.[context.currentSheetId]
        );

        const rowOverflowFreezeStyle = fixRowStyleOverflowInFreeze(
          context,
          filterOptions.startRow,
          filterOptions.startRow,
          refs.globalCache.freezen?.[context.currentSheetId]
        );

        const col = visibledatacolumn[v.col];
        const col_pre = v.col > 0 ? visibledatacolumn[v.col - 1] : 0;

        const left =
          v.col <= frozenColumns && columnOverflowFreezeStyle.left
            ? columnOverflowFreezeStyle.left + col - col_pre - 20
            : v.left;

        const top =
          filterOptions.startRow <= frozenRows && rowOverflowFreezeStyle.top
            ? rowOverflowFreezeStyle.top
            : v.top;

        const v_adjusted = { ...v, left, top };

        return (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              showFilterContextMenu(v_adjusted, i);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            tabIndex={0}
            key={i}
            style={_.assign(rowOverflowFreezeStyle, columnOverflowFreezeStyle, {
              left,
              top,
              height: undefined,
              width: undefined,
            })}
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
