import { Context, getSheetIndex, locale } from "@mritunjaygoutam12/core-mod";
import React, { useCallback, useContext, useEffect, useState } from "react";
import WorkbookContext from "../../context";
import ColorPicker from "../Toolbar/ColorPicker";
import "./index.css";

type Props = {
  triggerParentUpdate: (state: boolean) => void;
};

export const ChangeColor: React.FC<Props> = ({ triggerParentUpdate }) => {
  const { context, setContext } = useContext(WorkbookContext);
  const { toolbar, sheetconfig, button } = locale(context);
  const [inputColor, setInputColor] = useState<string>("#000000");
  const [selectColor, setSelectColor] = useState<undefined | string>(
    context.luckysheetfile[
      getSheetIndex(context, context.currentSheetId) as number
    ].color
  );

  // 确定按钮
  const certainBtn = useCallback(() => {
    setSelectColor(inputColor);
  }, [inputColor]);

  // 把用户选择的颜色记录在ctx中
  useEffect(() => {
    setContext((ctx: Context) => {
      if (ctx.allowEdit === false) return;
      const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
      ctx.luckysheetfile[index].color = selectColor;
    });
  }, [selectColor, setContext]);

  return (
    <div id="fortune-change-color">
      <div
        className="color-reset"
        onClick={() => setSelectColor(undefined)}
        tabIndex={0}
      >
        {sheetconfig.resetColor}
      </div>
      <div className="custom-color">
        <div>{toolbar.customColor}:</div>
        <input
          type="color"
          value={inputColor}
          onChange={(e) => setInputColor(e.target.value)}
          onFocus={() => {
            triggerParentUpdate(true);
          }}
          onBlur={() => {
            triggerParentUpdate(false);
          }}
        />
        <div
          className="button-basic button-primary"
          onClick={() => {
            certainBtn();
          }}
          tabIndex={0}
        >
          {button.confirm}
        </div>
      </div>
      <ColorPicker
        onPick={(color) => {
          setInputColor(color);
          setSelectColor(color);
        }}
      />
    </div>
  );
};
