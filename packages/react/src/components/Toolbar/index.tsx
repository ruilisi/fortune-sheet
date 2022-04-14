import React, { useContext, useCallback, useRef } from "react";
import {
  getToolbarItemClickHandler,
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
  handleMergeAll,
  handleBorderAll,
} from "@fortune-sheet/core";
import WorkbookContext from "../../context";
import "./index.css";
import Button from "./Button";
import Divider, { MenuDivider } from "./Divider";
import Combo from "./Combo";
import ColorPicker from "./ColorPicker";
import Select, { Option } from "./Select";
import SVGIcon from "../SVGIcon";

const Toolbar: React.FC = () => {
  const { context, setContext, refs, settings, handleUndo, handleRedo } =
    useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstSelection = context.luckysheet_select_save?.[0];
  const flowdata = getFlowdata(context);
  const row = firstSelection?.row_focus;
  const col = firstSelection?.column_focus;
  const cell = flowdata && row && col ? flowdata?.[row]?.[col] : undefined;
  const { toolbar, merge, border } = locale(context);

  const getToolbarItem = useCallback(
    (name: string, i: number) => {
      if (name === "|") {
        return <Divider key={i} />;
      }
      if (["text-color", "text-background"].includes(name)) {
        const pick = (color: string) => {
          setContext((draftCtx) =>
            (name === "text-color" ? handleTextColor : handleTextBackground)(
              draftCtx,
              refs.cellInput.current!,
              color
            )
          );
          if (name === "text-color") {
            refs.globalCache.recentTextColor = color;
          } else {
            refs.globalCache.recentBackgroundColor = color;
          }
        };
        return (
          <Combo
            iconId={name}
            key={name}
            tooltip={name}
            onClick={() => {
              const color =
                name === "text-color"
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
        );
      }
      if (name === "format") {
        return (
          <Combo text="自动" key={name} tooltip={name}>
            {(setOpen) => (
              <Select>
                <Option
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  自动
                </Option>
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "text-size") {
        return (
          <Combo
            text={cell ? normalizedCellAttr(cell, "fs") : "10"}
            key={name}
            tooltip={name}
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
      if (name === "undo") {
        return (
          <Button
            iconId={name}
            tooltip={toolbar[name]}
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
            tooltip={toolbar[name]}
            key={name}
            disabled={refs.globalCache.redoList.length === 0}
            onClick={() => handleRedo()}
          />
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
        if (flowdata?.[row_index][col_index]?.ps != null) {
          itemData = [
            { key: "edit", text: "编辑评论", onClick: editComment },
            { key: "delete", text: "删除", onClick: deleteComment },
            {
              key: "showOrHide",
              text: "显示/隐藏评论",
              onClick: showHideComment,
            },
            {
              key: "showOrHideAll",
              text: "显示/隐藏所有评论",
              onClick: showHideAllComments,
            },
          ];
        } else {
          itemData = [
            { key: "new", text: "新建评论", onClick: newComment },
            {
              key: "showOrHideAll",
              text: "显示/隐藏所有评论",
              onClick: showHideAllComments,
            },
          ];
        }
        return (
          <Combo iconId={name} key={name} tooltip={name}>
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

      if (name === "formula-sum") {
        const itemData = [
          { text: "求和", key: "SUM" },
          { text: "平均", key: "AVERAGE" },
          { text: "计数", key: "COUNT" },
          { text: "最大值", key: "MAX" },
          { text: "最小值", key: "MIN" },
        ];
        return (
          <Combo
            iconId={name}
            key={name}
            tooltip={name}
            text="求和"
            onClick={() =>
              setContext((ctx) => {
                handleSum(ctx, refs.cellInput.current!, refs.globalCache!);
              })
            }
          >
            {(setOpen) => (
              <Select>
                {itemData.map(({ key, text }) => (
                  <Option
                    key={key}
                    onClick={() => {
                      setContext((ctx) => {
                        autoSelectionFormula(
                          ctx,
                          refs.cellInput.current!,
                          key,
                          refs.globalCache
                        );
                      });
                      setOpen(false);
                    }}
                  >
                    <div
                      className="fortune-toolbar-menu-line"
                      style={{ width: 100 }}
                    >
                      <div>{text}</div>
                      <div>{key}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            )}
          </Combo>
        );
      }
      if (name === "merge-menu") {
        const itemdata = [
          { text: merge.mergeAll, value: "mergeAll" },
          { text: merge.mergeV, value: "mergeV" },
          { text: merge.mergeH, value: "mergeH" },
          { text: merge.mergeCancel, value: "mergeCancel" },
        ];
        return (
          <Combo
            iconId="merge-all"
            key={name}
            tooltip={name}
            text="合并单元格"
            onClick={() =>
              setContext((ctx) => {
                handleMergeAll(ctx, "mergeAll");
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
                        handleMergeAll(ctx, value);
                      });
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
      if (name === "border-menu") {
        const itemdata = [
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
          // { text: "", value: "divider", example: "" },
          // {"text": "<span id='luckysheet-icon-borderColor-linecolor' class='luckysheet-mousedown-cancel' style='border-bottom:3px solid #000;'>"+ locale_border.borderColor +"</span>", "value":"borderColor", "example":"more"},
          // {"text": ""+ locale_border.borderSize +"<img id='luckysheetborderSizepreview' width=100 height=10 src='data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==' style='position:absolute;bottom:-5px;right:0px;width:100px;height:10px;'>", "value":"borderSize", "example":"more"}
        ];
        return (
          <Combo
            iconId="border-all"
            key={name}
            tooltip={name}
            text="边框设置"
            onClick={() =>
              setContext((ctx) => {
                handleBorderAll(ctx, "border-all");
              })
            }
          >
            {(setOpen) => (
              <Select>
                {itemdata.map(({ text, value }) =>
                  value !== "divider" ? (
                    <Option
                      key={value}
                      onClick={() => {
                        setContext((ctx) => {
                          handleBorderAll(ctx, value);
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
                    <MenuDivider />
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
          // @ts-ignore
          tooltip={toolbar[name]}
          key={name}
          onClick={() =>
            setContext((draftCtx) => {
              getToolbarItemClickHandler(name)?.(
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
      setContext,
      refs.cellInput,
      refs.globalCache,
      cell,
      handleUndo,
      handleRedo,
      context.luckysheet_select_save,
      flowdata,
      merge.mergeAll,
      merge.mergeV,
      merge.mergeH,
      merge.mergeCancel,
      border.borderTop,
      border.borderBottom,
      border.borderLeft,
      border.borderRight,
      border.borderNone,
      border.borderAll,
      border.borderOutside,
      border.borderInside,
      border.borderHorizontal,
      border.borderVertical,
    ]
  );

  return (
    <div ref={containerRef} className="fortune-toolbar">
      <div className="luckysheet-toolbar-left-theme" />
      {settings.showtoolbarConfig.map((name, i) => getToolbarItem(name, i))}
    </div>
  );
};

export default Toolbar;
