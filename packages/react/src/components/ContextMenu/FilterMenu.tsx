import {
  clearFilter,
  locale,
  getFilterColumnValues,
  getFilterColumnColors,
  orderbydatafiler,
  saveFilter,
  FilterValue,
  FilterDate,
  FilterColor,
  Context,
} from "@fortune-sheet/core";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import _ from "lodash";
import produce from "immer";
import WorkbookContext from "../../context";
import Divider from "./Divider";
import Menu from "./Menu";
import SVGIcon from "../SVGIcon";
import { useAlert } from "../../hooks/useAlert";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import "./index.css";

const SelectItem: React.FC<{
  item: FilterValue;
  isChecked: (key: string) => boolean;
  onChange: (item: FilterValue, checked: boolean) => void;
  isItemVisible: (item: FilterValue) => boolean;
}> = ({ item, isChecked, onChange, isItemVisible }) => {
  const checked = useMemo(() => isChecked(item.key), [isChecked, item.key]);
  return isItemVisible(item) ? (
    <div className="select-item">
      <input
        className="filter-checkbox"
        type="checkbox"
        checked={checked}
        onChange={() => {
          onChange(item, !checked);
        }}
      />
      <div>{item.text}</div>
      <span className="count">{`( ${item.rows.length} )`}</span>
    </div>
  ) : null;
};

const DateSelectTreeItem: React.FC<{
  item: FilterDate;
  depth?: number;
  initialExpand: (key: string) => boolean;
  onExpand?: (key: string, expand: boolean) => void;
  isChecked: (key: string) => boolean;
  onChange: (data: FilterDate, checked: boolean) => void;
  isItemVisible: (item: FilterDate) => boolean;
}> = ({
  item,
  depth = 0,
  initialExpand,
  onExpand,
  isChecked,
  onChange,
  isItemVisible,
}) => {
  const [expand, setExpand] = useState(initialExpand(item.key));
  const checked = useMemo(() => isChecked(item.key), [isChecked, item.key]);

  return isItemVisible(item) ? (
    <div>
      <div
        className="select-item"
        style={{ marginLeft: -2 + depth * 20 }}
        onClick={() => {
          onExpand?.(item.key, !expand);
          setExpand(!expand);
        }}
      >
        {_.isEmpty(item.children) ? (
          <div style={{ width: 10 }} />
        ) : (
          <div
            className={`filter-caret ${expand ? "down" : "right"}`}
            style={{ cursor: "pointer" }}
          />
        )}
        <input
          className="filter-checkbox"
          type="checkbox"
          checked={checked}
          onChange={() => {
            onChange(item, !checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <div>{item.text}</div>
        <span className="count">{`( ${item.rows.length} )`}</span>
      </div>
      {expand &&
        item.children.map((v) => (
          <DateSelectTreeItem
            key={v.key}
            item={v}
            depth={depth + 1}
            {...{ initialExpand, onExpand, isChecked, onChange, isItemVisible }}
          />
        ))}
    </div>
  ) : null;
};

const DateSelectTree: React.FC<{
  dates: FilterDate[];
  initialExpand: (key: string) => boolean;
  onExpand?: (key: string, expand: boolean) => void;
  isChecked: (key: string) => boolean;
  onChange: (item: FilterDate, checked: boolean) => void;
  isItemVisible: (item: FilterDate) => boolean;
}> = ({
  dates,
  initialExpand,
  onExpand,
  isChecked,
  onChange,
  isItemVisible,
}) => {
  return (
    <>
      {dates.map((v) => (
        <DateSelectTreeItem
          key={v.key}
          item={v}
          {...{ initialExpand, onExpand, isChecked, onChange, isItemVisible }}
        />
      ))}
    </>
  );
};

const FilterMenu: React.FC = () => {
  const { context, setContext, settings } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<Context>(context);
  const byColorMenuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const { filterContextMenu } = context;
  const { startRow, startCol, endRow, endCol, col, listBoxMaxHeight } =
    filterContextMenu || {
      startRow: null,
      startCol: null,
      endRow: null,
      endCol: null,
      col: null,
      listBoxMaxHeight: 400,
    };
  const { filter } = locale(context);
  const [data, setData] = useState<{
    dates: FilterDate[];
    dateRowMap: Record<string, number[]>;
    values: FilterValue[];
    valueRowMap: Record<string, number[]>;
    visibleRows: number[];
    flattenValues: string[];
  }>({
    dates: [],
    dateRowMap: {},
    values: [],
    valueRowMap: {},
    visibleRows: [],
    flattenValues: [],
  });
  const [datesUncheck, setDatesUncheck] = useState<string[]>([]);
  const [valuesUncheck, setValuesUncheck] = useState<string[]>([]);
  const dateTreeExpandState = useRef<Record<string, boolean>>({});
  const hiddenRows = useRef<number[]>([]);
  const [showValues, setShowValues] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [subMenuPos, setSubMenuPos] =
    useState<{ left?: number; top: number; right?: number }>();
  const [filterColors, setFilterColors] = useState<{
    bgColors: FilterColor[];
    fcColors: FilterColor[];
  }>({ bgColors: [], fcColors: [] });
  const [showSubMenu, setShowSubMenu] = useState(false);
  const { showAlert } = useAlert();
  const mouseHoverSubMenu = useRef<boolean>(false);
  const [conditionText, setConditionText] = useState(filter.filiterInputNone);
  const [conditionValue, setConditionValue] = useState("");
  contextRef.current = context;

  const filterInputRef = useRef<HTMLInputElement>(null);

  // 点击其他区域的时候关闭FilterMenu
  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.filterContextMenu = undefined;
    });
  }, [setContext]);

  useOutsideClick(containerRef, close, [close]);

  const initialExpand = useCallback((key: string) => {
    const expand = dateTreeExpandState.current[key];
    if (expand == null) {
      dateTreeExpandState.current[key] = true;
      return true;
    }
    return expand;
  }, []);

  const onExpand = useCallback((key: string, expand: boolean) => {
    dateTreeExpandState.current[key] = expand;
  }, []);

  const searchValues = useMemo(
    () =>
      _.debounce((text: string) => {
        setShowValues(
          _.filter(
            data.flattenValues,
            (v) => v.toLowerCase().indexOf(text.toLowerCase()) > -1
          )
        );
      }, 300),
    [data.flattenValues]
  );

  const selectAll = useCallback(() => {
    setDatesUncheck([]);
    setValuesUncheck([]);
    hiddenRows.current = [];
  }, []);

  const clearAll = useCallback(() => {
    setDatesUncheck(_.keys(data.dateRowMap));
    setValuesUncheck(_.keys(data.valueRowMap));
    hiddenRows.current = data.visibleRows;
  }, [data.dateRowMap, data.valueRowMap, data.visibleRows]);

  const inverseSelect = useCallback(() => {
    setDatesUncheck(produce((draft) => _.xor(draft, _.keys(data.dateRowMap))));
    setValuesUncheck(
      produce((draft) => _.xor(draft, _.keys(data.valueRowMap)))
    );
    hiddenRows.current = _.xor(hiddenRows.current, data.visibleRows);
  }, [data.dateRowMap, data.valueRowMap, data.visibleRows]);

  const onColorSelectChange = useCallback(
    (key: string, color: string, checked: boolean) => {
      setFilterColors(
        produce((draft) => {
          const colorData = _.find(_.get(draft, key), (v) => v.color === color);
          colorData.checked = checked;
        })
      );
    },
    []
  );

  // 按条件筛选
  const filterByCondition = useCallback(
    (text: String | undefined, conditionItem: String) => {
      // 文本包含
      if (conditionItem === "conditionCellTextContain") {
        const filterRow = _.filter(
          data.flattenValues,
          (v) => v.toLowerCase().indexOf(text!.toLowerCase()) > -1
        );
        setDatesUncheck(produce((draft) => _.xor(draft, filterRow)));
        setValuesUncheck(produce((draft) => _.xor(draft, filterRow)));
        // Object.keys(data.valueRowMap).forEach(key=> {
        //   if(key.includes(filterRow))
        // })
        // _.pickBy(data.dateRowMap, (value, key) => {
        //   _.some(filterRow, (str) => _.includes(key, str));
        // }).forEach((value, key) => {
        //   console.info(value, key);
        // });
        // console.info(filterRow);
        hiddenRows.current = _.xor(
          data.visibleRows,
          data.valueRowMap[`${filterRow}#$$$#${filterRow}`]
        );
      }
      // 文本等于
      if (conditionItem === "conditionCellTextEqual") {
        const filterRow = _.filter(
          data.flattenValues,
          (v) => v.toLowerCase().indexOf(text!.toLowerCase()) > -1
        );
        setDatesUncheck(produce((draft) => _.xor(draft, filterRow)));
        setValuesUncheck(produce((draft) => _.xor(draft, filterRow)));
        hiddenRows.current = _.xor(
          data.visibleRows,
          data.valueRowMap[`${filterRow}#$$$#${filterRow}`]
        );
      }
    },
    [data.flattenValues, data.valueRowMap, data.visibleRows]
  );

  const handleConditionFilter = useCallback(
    (value: string) => {
      if (value === "conditionCellIsNull") {
        clearAll();
      } else if (value === "conditionCellNotNull") {
        selectAll();
      } else if (
        value ===
        ("conditionCellTextContain" ||
          "conditionCellTextNotContain" ||
          "conditionCellTextStart" ||
          "conditionCellTextEnd" ||
          "conditionCellTextEqual")
      ) {
        // 文本包含/不包含/开头为/结尾为/等于
      } else if (
        value ===
        ("conditionCellGreater" ||
          "conditionCellGreaterEqual" ||
          "conditionCellLess" ||
          "conditionCellLessEqual" ||
          "conditionCellEqual" ||
          "conditionCellNotEqual")
      ) {
        // 大于/大于等于/小于/小于等于/等于/不等于
      } else if (
        value === ("conditionCellBetween" || "conditionCellNotBetween")
      ) {
        // 介于
      }
    },
    [clearAll, selectAll]
  );

  const delayHideSubMenu = useMemo(
    () =>
      _.debounce(() => {
        if (mouseHoverSubMenu.current) return;
        setShowSubMenu(false);
      }, 200),
    []
  );

  const sortData = useCallback(
    (asc: boolean) => {
      if (col == null) return;
      setContext((draftCtx) => {
        const errMsg = orderbydatafiler(
          draftCtx,
          startRow,
          startCol,
          endRow,
          endCol,
          col,
          asc
        );
        if (errMsg != null) showAlert(errMsg);
      });
    },
    [col, setContext, startRow, startCol, endRow, endCol, showAlert]
  );

  const renderColorList = useCallback(
    (
      key: string,
      title: string,
      colors: FilterColor[],
      onSelectChange: (datakey: string, color: string, checked: boolean) => void
    ) =>
      colors.length > 1 ? (
        <div key={key}>
          <div className="title">{title}</div>
          <div className="color-list">
            {colors.map((v) => (
              <div
                key={v.color}
                className="item"
                onClick={() => onSelectChange(key, v.color, !v.checked)}
              >
                <div
                  className="color-label"
                  style={{ backgroundColor: v.color }}
                />
                <input
                  className="luckysheet-mousedown-cancel"
                  type="checkbox"
                  checked={v.checked}
                  onChange={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null,
    []
  );

  useLayoutEffect(() => {
    // re-position the filterContextMenu if it overflows the window
    if (!containerRef.current || !filterContextMenu) {
      return;
    }
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const rect = containerRef.current.getBoundingClientRect();
    const menuW = rect.width;
    // menu最小高度
    const menuH = 350;
    let top = filterContextMenu.y;
    let left = filterContextMenu.x;

    let hasOverflow = false;
    if (left + menuW > winW) {
      left -= menuW;
      hasOverflow = true;
    }
    if (top + menuH > winH) {
      top -= menuH;
      hasOverflow = true;
    }
    if (top < 0) {
      top = 0;
      hasOverflow = true;
    }
    // 适配小屏
    let containerH = winH - rect.top - 350;
    if (containerH < 0) {
      containerH = 100;
    }
    // 防止Maximum update depth exceeded错误，如果当前值和前一个filterContextMenu值一样则不进行赋值
    if (
      filterContextMenu.x === left &&
      filterContextMenu.y === top &&
      filterContextMenu.listBoxMaxHeight === containerH
    ) {
      return;
    }
    setContext((draftCtx) => {
      if (hasOverflow) {
        _.set(draftCtx, "filterContextMenu.x", left);
        _.set(draftCtx, "filterContextMenu.y", top);
      }
      _.set(draftCtx, "filterContextMenu.listBoxMaxHeight", containerH);
    });
  }, [filterContextMenu, setContext]);

  useLayoutEffect(() => {
    // re-position the subMenu if it overflows the window
    const rect = byColorMenuRef.current?.getBoundingClientRect();
    const subMenuRect = subMenuRef.current?.getBoundingClientRect();
    if (rect == null || subMenuRect == null) return;
    if (subMenuPos!.left! < rect.right) return;
    const winW = window.innerWidth;
    let hasOverflow = false;
    const pos = { top: rect.top - 5 };
    if (rect.right + subMenuRect.width > winW) {
      hasOverflow = true;
      _.set(pos, "left", rect.left - subMenuRect.width);
    }
    if (hasOverflow) {
      setSubMenuPos(pos);
    }
  }, [subMenuPos]);

  useEffect(() => {
    if (col == null) return;
    setSearchText("");
    setShowSubMenu(false);
    dateTreeExpandState.current = {};
    hiddenRows.current = filterContextMenu?.hiddenRows || [];
    const res = getFilterColumnValues(
      contextRef.current,
      col,
      startRow,
      endRow,
      startCol
    );
    setData(_.omit(res, ["datesUncheck", "valuesUncheck"]));
    setDatesUncheck(res.datesUncheck);
    setValuesUncheck(res.valuesUncheck);
    setShowValues(res.flattenValues);
  }, [
    col,
    endRow,
    startRow,
    startCol,
    hiddenRows,
    filterContextMenu?.hiddenRows,
  ]);

  useEffect(() => {
    if (col == null) return;
    setFilterColors(
      getFilterColumnColors(contextRef.current, col, startRow, endRow)
    );
  }, [col, endRow, startRow]);

  if (filterContextMenu == null) return null;

  return (
    <>
      <div
        className="fortune-context-menu luckysheet-cols-menu fortune-filter-menu"
        id="luckysheet-\${menuid}-menu"
        ref={containerRef}
        style={{ left: filterContextMenu.x, top: filterContextMenu.y }}
      >
        {settings.filterContextMenu?.map((name, i) => {
          if (name === "|") {
            return <Divider key={`divider-${i}`} />;
          }
          if (name === "sort-by-asc") {
            return (
              <Menu key={name} onClick={() => sortData(true)}>
                {filter.sortByAsc}
              </Menu>
            );
          }
          if (name === "sort-by-desc") {
            return (
              <Menu key={name} onClick={() => sortData(false)}>
                {filter.sortByDesc}
              </Menu>
            );
          }
          if (name === "filter-by-color") {
            return (
              <div
                key={name}
                ref={byColorMenuRef}
                onMouseEnter={() => {
                  if (!containerRef.current || !filterContextMenu) {
                    return;
                  }
                  setShowSubMenu(true);
                  const rect = byColorMenuRef.current?.getBoundingClientRect();
                  if (rect == null) return;
                  setSubMenuPos({ top: rect.top - 5, left: rect.right });
                }}
                onMouseLeave={delayHideSubMenu}
              >
                <Menu onClick={() => {}}>
                  <div className="filter-bycolor-container">
                    {filter.filterByColor}
                    <div className="filter-caret right" />
                  </div>
                </Menu>
              </div>
            );
          }
          if (name === "filter-by-condition") {
            return (
              <div key="name">
                <Menu onClick={() => {}}>
                  <div className="filter-caret right" />
                  {filter.filterByCondition}
                </Menu>
                <div
                  className="fortune-filter-bycondition"
                  // style={{ display: "none" }}
                >
                  <div
                    className="fortune-flat-menu-button fortune-mousedown-cancel"
                    id="fortune-filter-selected"
                  >
                    <span
                      className="fortune-mousedown-cancel"
                      data-value="null"
                      data-type="0"
                    >
                      {conditionText}
                    </span>
                    <div className="fortune-mousedown-cancel">
                      <i className="fa fa-sort" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="fortune-filter-submenu">
                    {[
                      { text: "单元格为空", value: "conditionCellIsNull" },
                      { text: "单元格有数据", value: "conditionCellNotNull" },
                      { text: "文本包含", value: "conditionCellTextContain" },
                      {
                        text: "文本不包含",
                        value: "conditionCellTextNotContain",
                      },
                      { text: "文本开头为", value: "conditionCellTextStart" },
                      { text: "文本结尾为", value: "conditionCellTextEnd" },
                      { text: "文本等于", value: "conditionCellTextEqual" },
                      // { text: "日期等于", value: "conditionCellDateEqual" },
                      // { text: "日期早于", value: "conditionCellDateBefore" },
                      // { text: "日期晚于", value: "conditionCellDateAfter" },
                      { text: "大于", value: "conditionCellGreater" },
                      { text: "大于等于", value: "conditionCellGreaterEqual" },
                      { text: "小于", value: "conditionCellLess" },
                      { text: "小于等于", value: "conditionCellLessEqual" },
                      { text: "等于", value: "conditionCellEqual" },
                      { text: "不等于", value: "conditionCellNotEqual" },
                      { text: "介于", value: "conditionCellBetween" },
                      { text: "不在其中", value: "conditionCellNotBetween" },
                    ].map((v) => (
                      <div
                        className="luckysheet-cols-menuitem luckysheet-mousedown-cancel"
                        key={v.value}
                        onClick={() => {
                          setConditionText(v.text);
                          setConditionValue(v.value);
                          handleConditionFilter(v.value);
                        }}
                      >
                        <div className="luckysheet-cols-menuitem-content luckysheet-mousedown-cancel">
                          {v.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="fortune-filter-selected-input">
                    <input
                      ref={filterInputRef}
                      type="text"
                      placeholder={filter.filiterInputTip}
                      className="fortune-mousedown-cancel"
                      onChange={(e) => {
                        filterByCondition(e.target.value, conditionValue);
                      }}
                    />
                  </div>
                  <div className="fortune-filter-selected-input fortune-filter-selected-input2">
                    <span>{filter.from}</span>
                    <input
                      type="text"
                      placeholder={filter.filiterRangeStartTip}
                      className="fortune-mousedown-cancel"
                    />
                    <span>{filter.to}</span>
                    <input
                      type="text"
                      placeholder={filter.filiterRangeEndTip}
                      className="fortune-mousedown-cancel"
                    />
                  </div>
                </div>
              </div>
            );
          }
          if (name === "filter-by-value") {
            return (
              <div key={name}>
                <Menu onClick={() => {}}>
                  <div className="filter-caret right" />
                  {filter.filterByValues}
                </Menu>
                <div className="luckysheet-filter-byvalue">
                  <div className="fortune-menuitem-row byvalue-btn-row">
                    <div>
                      <span className="fortune-byvalue-btn" onClick={selectAll}>
                        {filter.filterValueByAllBtn}
                      </span>
                      {" - "}
                      <span className="fortune-byvalue-btn" onClick={clearAll}>
                        {filter.filterValueByClearBtn}
                      </span>
                      {" - "}
                      <span
                        className="fortune-byvalue-btn"
                        onClick={inverseSelect}
                      >
                        {filter.filterValueByInverseBtn}
                      </span>
                    </div>
                    <div className="byvalue-filter-icon">
                      <SVGIcon
                        name="filter-fill"
                        style={{ width: 20, height: 20 }}
                      />
                    </div>
                  </div>
                  <div className="filtermenu-input-container">
                    <input
                      type="text"
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder={filter.filterValueByTip}
                      className="luckysheet-mousedown-cancel"
                      id="luckysheet-\${menuid}-byvalue-input"
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                        searchValues(e.target.value);
                      }}
                    />
                  </div>
                  <div
                    id="luckysheet-filter-byvalue-select"
                    style={{ maxHeight: listBoxMaxHeight }}
                  >
                    <DateSelectTree
                      dates={data.dates}
                      onExpand={onExpand}
                      initialExpand={initialExpand}
                      isChecked={(key: string) =>
                        _.find(
                          datesUncheck,
                          (v: string) => v.match(key) != null
                        ) == null
                      }
                      onChange={(item: FilterDate, checked: boolean) => {
                        const rows = hiddenRows.current;
                        hiddenRows.current = checked
                          ? _.without(rows, ...item.rows)
                          : _.union(rows, item.rows);
                        setDatesUncheck(
                          produce((draft) => {
                            return checked
                              ? _.without(draft, ...item.dateValues)
                              : _.union(draft, item.dateValues);
                          })
                        );
                      }}
                      isItemVisible={(item) => {
                        return showValues.length === data.flattenValues.length
                          ? true
                          : _.findIndex(
                              showValues,
                              (v) => v.match(item.key) != null
                            ) > -1;
                      }}
                    />
                    {data.values.map((v) => (
                      <SelectItem
                        key={v.key}
                        item={v}
                        isChecked={(key: string) =>
                          !_.includes(valuesUncheck, key)
                        }
                        onChange={(item: FilterValue, checked: boolean) => {
                          const rows = hiddenRows.current;
                          hiddenRows.current = checked
                            ? _.without(rows, ...item.rows)
                            : _.concat(rows, item.rows);
                          setValuesUncheck(
                            produce((draft) => {
                              if (checked) {
                                _.pull(draft, item.key);
                              } else {
                                draft.push(item.key);
                              }
                            })
                          );
                        }}
                        isItemVisible={(item) => {
                          return showValues.length === data.flattenValues.length
                            ? true
                            : _.includes(showValues, item.text);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
        <Divider />
        <div className="fortune-menuitem-row">
          <div
            className="button-basic button-primary"
            onClick={() => {
              if (col == null) return;
              setContext((draftCtx) => {
                const rowHidden = _.reduce(
                  hiddenRows.current,
                  (pre, curr) => {
                    pre[curr] = 0;
                    return pre;
                  },
                  {} as Record<string, number>
                );
                saveFilter(
                  draftCtx,
                  hiddenRows.current.length > 0,
                  rowHidden,
                  {},
                  startRow,
                  endRow,
                  col,
                  startCol,
                  endCol
                );
                hiddenRows.current = [];
                draftCtx.filterContextMenu = undefined;
              });
            }}
          >
            {filter.filterConform}
          </div>
          <div
            className="button-basic button-default"
            onClick={() => {
              setContext((draftCtx) => {
                draftCtx.filterContextMenu = undefined;
              });
            }}
          >
            {filter.filterCancel}
          </div>
          <div
            className="button-basic button-danger"
            onClick={() => {
              setContext((draftCtx) => {
                clearFilter(draftCtx);
              });
            }}
          >
            {filter.clearFilter}
          </div>
        </div>
      </div>
      {showSubMenu && (
        <div
          ref={subMenuRef}
          className="luckysheet-filter-bycolor-submenu"
          style={subMenuPos}
          onMouseEnter={() => {
            mouseHoverSubMenu.current = true;
          }}
          onMouseLeave={() => {
            mouseHoverSubMenu.current = false;
            setShowSubMenu(false);
          }}
        >
          {filterColors.bgColors.length < 2 &&
          filterColors.fcColors.length < 2 ? (
            <div className="one-color-tip">
              {filter.filterContainerOneColorTip}
            </div>
          ) : (
            <>
              {[
                {
                  key: "bgColors",
                  title: filter.filiterByColorTip,
                  colors: filterColors.bgColors,
                },
                {
                  key: "fcColors",
                  title: filter.filiterByTextColorTip,
                  colors: filterColors.fcColors,
                },
              ].map((v) =>
                renderColorList(v.key, v.title, v.colors, onColorSelectChange)
              )}
              <div
                className="button-basic button-primary"
                onClick={() => {
                  if (col == null) return;
                  setContext((draftCtx) => {
                    const rowHidden = _.reduce(
                      _(filterColors)
                        .values()
                        .flatten()
                        .map((v) => (v.checked ? [] : v.rows))
                        .flatten()
                        .valueOf(),
                      (pre, curr) => {
                        pre[curr] = 0;
                        return pre;
                      },
                      {} as Record<string, number>
                    );
                    saveFilter(
                      draftCtx,
                      !_.isEmpty(rowHidden),
                      rowHidden,
                      {},
                      startRow,
                      endRow,
                      col,
                      startCol,
                      endCol
                    );
                    hiddenRows.current = [];
                    draftCtx.filterContextMenu = undefined;
                  });
                }}
              >
                {filter.filterConform}
              </div>
            </>
          )}
        </div>
      )}
      {/* {showByConditionSubMenu && (
        <div className="fortune-filter-bycondition-submenu">
          {[
            {
              key: "byCondition",
              title: filter.conditionNone,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellNotNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellTextContain,
            },
            {
              key: "byCondition",
              title: filter.conditionCellTextNotContain,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
            {
              key: "byCondition",
              title: filter.conditionCellIsNull,
            },
          ]}
        </div>
      )} */}
    </>
  );
};

export default FilterMenu;
