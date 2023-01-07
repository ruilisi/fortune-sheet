import React, {
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  toolbarItemClickHandler,
  handleTextBackground,
  handleTextColor,
  handleTextSize,
  normalizedCellAttr,
  getFlowdata,
  newComment,
  editComment,
  deleteComment,
  showHideComment,
  showHideAllComments,
  autoSelectionFormula,
  handleSum,
  locale,
  handleMerge,
  handleBorder,
  toolbarItemSelectedFunc,
  handleFreeze,
  insertImage,
  showImgChooser,
  updateFormat,
  handleSort,
  handleHorizontalAlign,
  handleVerticalAlign,
  handleScreenShot,
  createFilter,
  clearFilter,
  applyLocation,
} from "@fortune-sheet/core";
import _ from "lodash";
import WorkbookContext from "../../context";
import "./index.css";
import Button from "./Button";
import Divider, { MenuDivider } from "./Divider";
import Combo from "./Combo";
import ColorPicker from "./ColorPicker";
import Select, { Option } from "./Select";
import SVGIcon from "../SVGIcon";
import { useDialog } from "../../hooks/useDialog";
import { FormulaSearch } from "../FormulaSearch";
import { SplitColumn } from "../SplitColumn";
import { LocationCondition } from "../LocationCondition";

const Toolbar: React.FC<{
  setMoreItems: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  moreItemsOpen: boolean;
}> = ({ setMoreItems, moreItemsOpen }) => {
  const { context, setContext, refs, settings, handleUndo, handleRedo } =
    useContext(WorkbookContext);
  const contextRef = useRef(context);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbarWrapIndex, setToolbarWrapIndex] = useState(-1); // -1 means pending for item location calculation
  const [itemLocations, setItemLocations] = useState<number[]>([]);
  const { showDialog, hideDialog } = useDialog();
  const firstSelection = context.luckysheet_select_save?.[0];
  const flowdata = getFlowdata(context);
  contextRef.current = context;
  const row = firstSelection?.row_focus;

  const col = firstSelection?.column_focus;
  const cell =
    flowdata && row != null && col != null ? flowdata?.[row]?.[col] : undefined;
  const {
    toolbar,
    merge,
    border,
    freezen,
    defaultFmt,
    formula,
    sort,
    align,
    textWrap,
    rotation,
    screenshot,
    filter,
    splitText,
    findAndReplace,
    comment,
  } = locale(context);
  const sheetWidth = context.luckysheetTableContentHW[0];

  // rerenders the entire toolbar and trigger recalculation of item locations
  useEffect(() => {
    setToolbarWrapIndex(-1);
  }, [settings.toolbarItems]);

  // recalculate item locations
  useEffect(() => {
    if (toolbarWrapIndex === -1) {
      const container = containerRef.current!;
      if (!container) return;
      const items = container.querySelectorAll(".fortune-toolbar-item");
      if (!items) return;
      const locations: number[] = [];
      const containerRect = container.getBoundingClientRect();
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i] as HTMLElement;
        const itemRect = item.getBoundingClientRect();
        locations.push(itemRect.left - containerRect.left + itemRect.width);
      }
      setItemLocations(locations);
    }
  }, [toolbarWrapIndex, sheetWidth]);

  // calculate the position after which items should be wrapped
  useEffect(() => {
    if (itemLocations.length === 0) return;
    const container = containerRef.current!;
    if (!container) return;
    const moreButtonWidth = 50;
    for (let i = itemLocations.length - 1; i >= 0; i -= 1) {
      const loc = itemLocations[i];
      if (loc + moreButtonWidth < container.clientWidth) {
        setToolbarWrapIndex(i);
        if (i === itemLocations.length - 1) {
          setMoreItems(null);
        }
        break;
      }
    }
  }, [itemLocations, setMoreItems, sheetWidth]);

  const getToolbarItem = useCallback(
    (name: string, i: number) => {
      // @ts-ignore
      const tooltip = toolbar[name];
      if (name === "|") {
        return <Divider key={i} />;
      }
      if (["font-color", "background"].includes(name)) {
        const pick = (color: string) => {
          setContext((draftCtx) =>
            (name === "font-color" ? handleTextColor : handleTextBackground)(
              draftCtx,
              refs.cellInput.current!,
              color
            )
          );
          if (name === "font-color") {
            refs.globalCache.recentTextColor = color;
          } else {
            refs.globalCache.recentBackgroundColor = color;
          }
        };
        return (
          <div style={{ position: "relative" }} key={name}>
            <div
              style={{
                width: 17,
                height: 2,
                backgroundColor:
                  name === "font-color"
                    ? refs.globalCache.recentTextColor
                    : refs.globalCache.recentBackgroundColor,
                position: "absolute",
                bottom: 8,
                left: 9,
                zIndex: 100,
              }}
            />
            <Combo
              iconId={name}
              tooltip={tooltip}
              onClick={() => {
                const color =
                  name === "font-color"
                    ? refs.globalCache.recentTextColor
                    : refs.globalCache.recentBackgroundColor;
                if (color) pick(color);
              }}
            >
              {(setOpen) => (
                <ColorPicker
                  onPick={(color) => {
                    pick(color);
                    setOpen(false);
                  }}
                />
              )}
            </Combo>
          </div>
        );
      }
      if (name === "format") {
        let currentFmt = defaultFmt[0].text;
        if (cell) {
          const curr = normalizedCellAttr(cell, "ct");
          const format = _.find(defaultFmt, (v) => v.value === curr?.fa);
          if (curr?.fa != null) {
            if (format != null) {
              currentFmt = format.text;
            } else {
              currentFmt = defaultFmt[defaultFmt.length - 1].text;
            }
          }
        }
        return (
          <Combo text={currentFmt} key={name} tooltip={tooltip}>
            {(setOpen) => (
              <Select>
                {defaultFmt
                  .slice(0, defaultFmt.length - 2)
                  .map(({ text, value, example }, ii) =>
                    value !== "split" ? (
                      <Option
                        key={value}
                        onClick={() => {
                          setOpen(false);
                          setContext((ctx) => {
                            const d = getFlowdata(ctx);
                            if (d == null) return;
                            updateFormat(
                              ctx,
                              refs.cellInput.current!,
                              d,
                              "ct",
                              value
                            );
                          });
                        }}
                      >
                        <div className="fortune-toolbar-menu-line">
                          <div>{text}</div>
                          <div className="fortune-toolbar-subtext">
                            {example}
                          </div>
                        </div>
                      </Option>
                    ) : (
                      <MenuDivider key={ii} />
                    )
                  )}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "font-size") {
        return (
          <Combo
            text={
              cell
                ? normalizedCellAttr(cell, "fs", context.defaultFontSize)
                : context.defaultFontSize.toString()
            }
            key={name}
            tooltip={tooltip}
          >
            {(setOpen) => (
              <Select>
                {[
                  9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
                ].map((num) => (
                  <Option
                    key={num}
                    onClick={() => {
                      setContext((draftContext) =>
                        handleTextSize(
                          draftContext,
                          refs.cellInput.current!,
                          num
                        )
                      );
                      setOpen(false);
                    }}
                  >
                    {num}
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "horizontal-align") {
        const items = [
          {
            title: "align-left",
            text: align.left,
            value: 1,
          },
          {
            title: "align-center",
            text: align.center,
            value: 0,
          },
          {
            title: "align-right",
            text: align.right,
            value: 2,
          },
        ];
        return (
          <Combo
            iconId={
              _.find(items, (item) => `${item.value}` === `${cell?.ht}`)
                ?.title || "align-left"
            }
            key={name}
            tooltip={toolbar.horizontalAlign}
          >
            {(setOpen) => (
              <Select>
                {items.map(({ text, title }) => (
                  <Option
                    key={title}
                    onClick={() => {
                      setContext((ctx) => {
                        handleHorizontalAlign(
                          ctx,
                          refs.cellInput.current!,
                          title.replace("align-", "")
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      {text}
                      <SVGIcon name={title} />
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "vertical-align") {
        const items = [
          {
            title: "align-top",
            text: align.top,
            value: 1,
          },
          {
            title: "align-middle",
            text: align.middle,
            value: 0,
          },
          {
            title: "align-bottom",
            text: align.bottom,
            value: 2,
          },
        ];
        return (
          <Combo
            iconId={
              _.find(items, (item) => `${item.value}` === `${cell?.vt}`)
                ?.title || "align-top"
            }
            key={name}
            tooltip={toolbar.verticalAlign}
          >
            {(setOpen) => (
              <Select>
                {items.map(({ text, title }) => (
                  <Option
                    key={title}
                    onClick={() => {
                      setContext((ctx) => {
                        handleVerticalAlign(
                          ctx,
                          refs.cellInput.current!,
                          title.replace("align-", "")
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      {text}
                      <SVGIcon name={title} />
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "undo") {
        return (
          <Button
            iconId={name}
            tooltip={tooltip}
            key={name}
            disabled={refs.globalCache.undoList.length === 0}
            onClick={() => handleUndo()}
          />
        );
      }
      if (name === "redo") {
        return (
          <Button
            iconId={name}
            tooltip={tooltip}
            key={name}
            disabled={refs.globalCache.redoList.length === 0}
            onClick={() => handleRedo()}
          />
        );
      }
      if (name === "screenshot") {
        return (
          <Button
            iconId={name}
            tooltip={tooltip}
            key={name}
            onClick={() => {
              const imgsrc = handleScreenShot(contextRef.current);
              if (imgsrc) {
                showDialog(
                  <div>
                    <div>{screenshot.screenshotTipSuccess}</div>
                    <img
                      src={imgsrc}
                      alt=""
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </div>
                );
              }
            }}
          />
        );
      }
      if (name === "splitColumn") {
        return (
          <Button
            iconId={name}
            tooltip={tooltip}
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              if (_.isUndefined(context.luckysheet_select_save)) {
                showDialog(splitText.tipNoSelect, "ok");
              } else {
                const currentColumn =
                  context.luckysheet_select_save[
                    context.luckysheet_select_save.length - 1
                  ].column;
                if (context.luckysheet_select_save.length > 1) {
                  showDialog(splitText.tipNoMulti, "ok");
                } else if (currentColumn[0] !== currentColumn[1]) {
                  showDialog(splitText.tipNoMultiColumn, "ok");
                } else {
                  showDialog(<SplitColumn />);
                }
              }
            }}
          />
        );
      }
      if (name === "locationCondition") {
        const items = [
          {
            text: findAndReplace.location,
            value: "location",
          },
          {
            text: findAndReplace.locationFormula,
            value: "locationFormula",
          },
          {
            text: findAndReplace.locationDate,
            value: "locationDate",
          },
          {
            text: findAndReplace.locationDigital,
            value: "locationDigital",
          },
          {
            text: findAndReplace.locationString,
            value: "locationString",
          },
          {
            text: findAndReplace.locationError,
            value: "locationError",
          },
          // TODO 条件格式
          // {
          //   text: findAndReplace.locationCondition,
          //   value: "locationCondition",
          // },
          {
            text: findAndReplace.locationRowSpan,
            value: "locationRowSpan",
          },
          {
            text: findAndReplace.columnSpan,
            value: "locationColumnSpan",
          },
        ];
        return (
          <Combo
            iconId="locationCondition"
            key={name}
            tooltip={findAndReplace.location}
          >
            {(setOpen) => (
              <Select>
                {items.map(({ text, value }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      const last = context.luckysheet_select_save![0];
                      let range: { row: any[]; column: any[] }[];
                      let rangeArr = [];
                      if (
                        context.luckysheet_select_save?.length === 0 ||
                        (context.luckysheet_select_save?.length === 1 &&
                          last.row[0] === last.row[1] &&
                          last.column[0] === last.column[1])
                      ) {
                        // 当选中的是一个单元格，则变为全选
                        range = [
                          {
                            row: [0, flowdata!.length - 1],
                            column: [0, flowdata![0].length - 1],
                          },
                        ];
                      } else {
                        range = _.assignIn([], context.luckysheet_select_save);
                      }
                      if (value === "location") {
                        showDialog(<LocationCondition />);
                      } else if (value === "locationFormula") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationFormula",
                            "all",
                            ctx
                          );
                        });
                      } else if (value === "locationDate") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationConstant",
                            "d",
                            ctx
                          );
                        });
                      } else if (value === "locationDigital") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationConstant",
                            "n",
                            ctx
                          );
                        });
                      } else if (value === "locationString") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationConstant",
                            "s,g",
                            ctx
                          );
                        });
                      } else if (value === "locationError") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationConstant",
                            "e",
                            ctx
                          );
                        });
                      } else if (value === "locationCondition") {
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationCF",
                            undefined,
                            ctx
                          );
                        });
                      } else if (value === "locationRowSpan") {
                        if (
                          context.luckysheet_select_save?.length === 0 ||
                          (context.luckysheet_select_save?.length === 1 &&
                            context.luckysheet_select_save[0].row[0] ===
                              context.luckysheet_select_save[0].row[1])
                        ) {
                          showDialog(
                            findAndReplace.locationTiplessTwoRow,
                            "ok"
                          );
                          return;
                        }
                        range = _.assignIn([], context.luckysheet_select_save);
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationRowSpan",
                            undefined,
                            ctx
                          );
                        });
                      } else if (value === "locationColumnSpan") {
                        if (
                          context.luckysheet_select_save?.length === 0 ||
                          (context.luckysheet_select_save?.length === 1 &&
                            context.luckysheet_select_save[0].column[0] ===
                              context.luckysheet_select_save[0].column[1])
                        ) {
                          showDialog(
                            findAndReplace.locationTiplessTwoColumn,
                            "ok"
                          );
                          return;
                        }
                        range = _.assignIn([], context.luckysheet_select_save);
                        setContext((ctx) => {
                          rangeArr = applyLocation(
                            range,
                            "locationColumnSpan",
                            undefined,
                            ctx
                          );
                        });
                      }
                      if (rangeArr.length === 0 && value !== "location")
                        showDialog(findAndReplace.locationTipNotFindCell, "ok");
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">{text}</div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "image") {
        return (
          <Button
            iconId={name}
            tooltip={toolbar.insertImage}
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              showImgChooser();
            }}
          >
            <input
              id="fortune-img-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;

                const render = new FileReader();
                render.readAsDataURL(file);
                render.onload = (event) => {
                  if (event.target == null) return;
                  const src = event.target?.result;
                  const image = new Image();
                  image.onload = () => {
                    setContext((draftCtx) => {
                      insertImage(draftCtx, image);
                    });
                  };
                  image.src = src as string;
                };
                e.currentTarget.value = "";
              }}
            />
          </Button>
        );
      }
      if (name === "comment") {
        const last =
          context.luckysheet_select_save?.[
            context.luckysheet_select_save.length - 1
          ];
        let row_index = last?.row_focus;
        let col_index = last?.column_focus;
        if (!last) {
          row_index = 0;
          col_index = 0;
        } else {
          if (row_index == null) {
            [row_index] = last.row;
          }
          if (col_index == null) {
            [col_index] = last.column;
          }
        }
        let itemData: { key: any; text: any; onClick: any }[];
        if (flowdata?.[row_index]?.[col_index]?.ps != null) {
          itemData = [
            { key: "edit", text: comment.edit, onClick: editComment },
            { key: "delete", text: comment.delete, onClick: deleteComment },
            {
              key: "showOrHide",
              text: comment.showOne,
              onClick: showHideComment,
            },
            {
              key: "showOrHideAll",
              text: comment.showAll,
              onClick: showHideAllComments,
            },
          ];
        } else {
          itemData = [
            { key: "new", text: comment.insert, onClick: newComment },
            {
              key: "showOrHideAll",
              text: comment.showAll,
              onClick: showHideAllComments,
            },
          ];
        }
        return (
          <Combo iconId={name} key={name} tooltip={tooltip}>
            {(setOpen) => (
              <Select>
                {itemData.map(({ key, text, onClick }) => (
                  <Option
                    key={key}
                    onClick={() => {
                      setContext((draftContext) =>
                        onClick(
                          draftContext,
                          refs.globalCache,
                          row_index,
                          col_index
                        )
                      );
                      setOpen(false);
                    }}
                  >
                    {text}
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }

      if (name === "quick-formula") {
        const itemData = [
          { text: formula.sum, value: "SUM" },
          { text: formula.average, value: "AVERAGE" },
          { text: formula.count, value: "COUNT" },
          { text: formula.max, value: "MAX" },
          { text: formula.min, value: "MIN" },
        ];
        return (
          <Combo
            iconId="formula-sum"
            key={name}
            tooltip={toolbar.autoSum}
            onClick={() =>
              setContext((ctx) => {
                handleSum(ctx, refs.cellInput.current!, refs.globalCache!);
              })
            }
          >
            {(setOpen) => (
              <Select>
                {itemData.map(({ value, text }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      setContext((ctx) => {
                        autoSelectionFormula(
                          ctx,
                          refs.cellInput.current!,
                          value,
                          refs.globalCache
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      <div>{text}</div>
                      <div className="fortune-toolbar-subtext">{value}</div>
                    </div>
                  </Option>
                ))}
                <MenuDivider />
                <Option
                  key="formula"
                  onClick={() => {
                    showDialog(<FormulaSearch onCancel={hideDialog} />);
                    setOpen(false);
                  }}
                >{`${formula.find}...`}</Option>
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "merge-cell") {
        const itemdata = [
          { text: merge.mergeAll, value: "merge-all" },
          { text: merge.mergeV, value: "merge-vertical" },
          { text: merge.mergeH, value: "merge-horizontal" },
          { text: merge.mergeCancel, value: "merge-cancel" },
        ];
        return (
          <Combo
            iconId="merge-all"
            key={name}
            tooltip={tooltip}
            text="合并单元格"
            onClick={() =>
              setContext((ctx) => {
                handleMerge(ctx, "merge-all");
              })
            }
          >
            {(setOpen) => (
              <Select>
                {itemdata.map(({ text, value }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      setContext((ctx) => {
                        handleMerge(ctx, value);
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      <SVGIcon name={value} style={{ marginRight: 4 }} />
                      {text}
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "border") {
        const items = [
          {
            text: border.borderTop,
            value: "border-top",
          },
          {
            text: border.borderBottom,
            value: "border-bottom",
          },
          {
            text: border.borderLeft,
            value: "border-left",
          },
          {
            text: border.borderRight,
            value: "border-right",
          },
          { text: "", value: "divider" },
          {
            text: border.borderNone,
            value: "border-none",
          },
          {
            text: border.borderAll,
            value: "border-all",
          },
          {
            text: border.borderOutside,
            value: "border-outside",
          },
          { text: "", value: "divider" },
          {
            text: border.borderInside,
            value: "border-inside",
          },
          {
            text: border.borderHorizontal,
            value: "border-horizontal",
          },
          {
            text: border.borderVertical,
            value: "border-vertical",
          },
          {
            text: border.borderSlash,
            value: "border-slash",
          },
        ];
        return (
          <Combo
            iconId="border-all"
            key={name}
            tooltip={tooltip}
            text="边框设置"
            onClick={() =>
              setContext((ctx) => {
                handleBorder(ctx, "border-all");
              })
            }
          >
            {(setOpen) => (
              <Select>
                {items.map(({ text, value }, ii) =>
                  value !== "divider" ? (
                    <Option
                      key={value}
                      onClick={() => {
                        setContext((ctx) => {
                          handleBorder(ctx, value);
                        });
                        setOpen(false);
                      }}
                    >
                      <div className="fortune-toolbar-menu-line">
                        {text}
                        <SVGIcon name={value} />
                      </div>
                    </Option>
                  ) : (
                    <MenuDivider key={ii} />
                  )
                )}
              </Select>
            )}
          </Combo>
        );
      }

      if (name === "freeze") {
        const items = [
          {
            text: freezen.freezenRowRange,
            value: "freeze-row",
          },
          {
            text: freezen.freezenColumnRange,
            value: "freeze-col",
          },
          {
            text: freezen.freezenRCRange,
            value: "freeze-row-col",
          },
          {
            text: freezen.freezenCancel,
            value: "freeze-cancel",
          },
        ];
        return (
          <Combo
            iconId="freeze-row-col"
            key={name}
            tooltip={tooltip}
            onClick={() =>
              setContext((ctx) => {
                handleFreeze(ctx, "freeze-row-col");
              })
            }
          >
            {(setOpen) => (
              <Select>
                {items.map(({ text, value }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      setContext((ctx) => {
                        handleFreeze(ctx, value);
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      {text}
                      <SVGIcon name={value} />
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "text-wrap") {
        const items = [
          {
            text: textWrap.clip,
            iconId: "text-clip",
            value: "clip",
          },
          {
            text: textWrap.overflow,
            iconId: "text-overflow",
            value: "overflow",
          },
          {
            text: textWrap.wrap,
            iconId: "text-wrap",
            value: "wrap",
          },
        ];
        let curr = items[0];
        if (cell?.tb != null) {
          curr = _.get(items, cell.tb);
        }
        return (
          <Combo iconId={curr.iconId} key={name} tooltip={toolbar.textWrap}>
            {(setOpen) => (
              <Select>
                {items.map(({ text, iconId, value }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      setContext((ctx) => {
                        const d = getFlowdata(ctx);
                        if (d == null) return;
                        updateFormat(
                          ctx,
                          refs.cellInput.current!,
                          d,
                          "tb",
                          value
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      {text}
                      <SVGIcon name={iconId} />
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "text-rotation") {
        const items = [
          { text: rotation.none, iconId: "text-rotation-none", value: "none" },
          {
            text: rotation.angleup,
            iconId: "text-rotation-angleup",
            value: "angleup",
          },
          {
            text: rotation.angledown,
            iconId: "text-rotation-angledown",
            value: "angledown",
          },
          {
            text: rotation.vertical,
            iconId: "text-rotation-vertical",
            value: "vertical",
          },
          {
            text: rotation.rotationUp,
            iconId: "text-rotation-up",
            value: "rotation-up",
          },
          {
            text: rotation.rotationDown,
            iconId: "text-rotation-down",
            value: "rotation-down",
          },
        ];
        let curr = items[0];
        if (cell?.tr != null) {
          curr = _.get(items, cell.tr);
        }
        return (
          <Combo iconId={curr.iconId} key={name} tooltip={toolbar.textRotate}>
            {(setOpen) => (
              <Select>
                {items.map(({ text, iconId, value }) => (
                  <Option
                    key={value}
                    onClick={() => {
                      setContext((ctx) => {
                        const d = getFlowdata(ctx);
                        if (d == null) return;
                        updateFormat(
                          ctx,
                          refs.cellInput.current!,
                          d,
                          "tr",
                          value
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div className="fortune-toolbar-menu-line">
                      {text}
                      <SVGIcon name={iconId} />
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "filter") {
        const items = [
          {
            iconId: "sort-asc",
            value: "sort-asc",
            text: sort.asc,
            onClick: () => {
              setContext((ctx) => {
                handleSort(ctx, true);
              });
            },
          },
          {
            iconId: "sort-desc",
            value: "sort-desc",
            text: sort.desc,
            onClick: () => {
              setContext((ctx) => {
                handleSort(ctx, false);
              });
            },
          },
          // { iconId: "sort", value: "sort", text: sort.custom },
          { iconId: "", value: "divider" },
          {
            iconId: "filter1",
            value: "filter",
            text: filter.filter,
            onClick: () =>
              setContext((draftCtx) => {
                createFilter(draftCtx);
              }),
          },
          {
            iconId: "eraser",
            value: "eraser",
            text: filter.clearFilter,
            onClick: () =>
              setContext((draftCtx) => {
                clearFilter(draftCtx);
              }),
          },
        ];
        return (
          <Combo iconId="filter" key={name} tooltip={toolbar.sortAndFilter}>
            {(setOpen) => (
              <Select>
                {items.map(({ text, iconId, value, onClick }, index) =>
                  value !== "divider" ? (
                    <Option
                      key={value}
                      onClick={() => {
                        onClick?.();
                        setOpen(false);
                      }}
                    >
                      <div className="fortune-toolbar-menu-line">
                        {text}
                        <SVGIcon name={iconId} />
                      </div>
                    </Option>
                  ) : (
                    <MenuDivider key={`divider-${index}`} />
                  )
                )}
              </Select>
            )}
          </Combo>
        );
      }
      return (
        <Button
          iconId={name}
          tooltip={tooltip}
          key={name}
          selected={toolbarItemSelectedFunc(name)?.(cell)}
          onClick={() =>
            setContext((draftCtx) => {
              toolbarItemClickHandler(name)?.(
                draftCtx,
                refs.cellInput.current!,
                refs.globalCache
              );
            })
          }
        />
      );
    },
    [
      toolbar,
      cell,
      setContext,
      refs.cellInput,
      refs.globalCache,
      defaultFmt,
      align,
      handleUndo,
      handleRedo,
      flowdata,
      formula,
      showDialog,
      hideDialog,
      merge,
      border,
      freezen,
      screenshot,
      sort,
      textWrap,
      rotation,
      filter,
      splitText,
      findAndReplace,
      context.luckysheet_select_save,
      context.defaultFontSize,
      context.allowEdit,
      comment,
    ]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar">
      {(toolbarWrapIndex === -1
        ? settings.toolbarItems
        : settings.toolbarItems.slice(0, toolbarWrapIndex + 1)
      ).map((name, i) => getToolbarItem(name, i))}
      {toolbarWrapIndex !== -1 &&
      toolbarWrapIndex < settings.toolbarItems.length - 1 ? (
        <Button
          iconId="more"
          tooltip={toolbar.toolMore}
          onClick={() => {
            if (moreItemsOpen) {
              setMoreItems(null);
            } else {
              setMoreItems(
                settings.toolbarItems
                  .slice(toolbarWrapIndex + 1)
                  .map((name, i) => getToolbarItem(name, i))
              );
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default Toolbar;
