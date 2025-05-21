import React, { useContext, useState, useCallback, useMemo } from "react";
import {
  cancelNormalSelected,
  getSheetIndex,
  locale,
  update,
} from "@jadinec/core-sheet";
import _ from "lodash";
import WorkbookContext from "../../context";
import "./index.css";
import { useDialog } from "../../hooks/useDialog";

export const FormatSearch: React.FC<{
  type: "currency" | "date" | "number";
  onCancel: () => void;
}> = ({ type, onCancel: _onCancel }) => {
  const {
    context,
    setContext,
    refs: { cellInput },
  } = useContext(WorkbookContext);
  const [decimalPlace, setDecimalPlace] = useState(2);
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0);
  const { button, format, currencyDetail, dateFmtList, numberFmtList } =
    locale(context);
  const { showDialog } = useDialog();
  const toolbarFormatAll = useMemo(
    () => ({
      currency: currencyDetail,
      date: dateFmtList,
      number: numberFmtList,
    }),
    [currencyDetail, dateFmtList, numberFmtList]
  );

  type toolbarFormatType = { name: string; pos?: string; value: string };

  const toolbarFormat: toolbarFormatType[] = useMemo(
    () => toolbarFormatAll[type],
    [toolbarFormatAll, type]
  );
  const tips = _.get(format, type);

  const onConfirm = useCallback(() => {
    if (decimalPlace < 0 || decimalPlace > 9) {
      _onCancel();
      showDialog(format.tipDecimalPlaces, "ok");
      return;
    }
    setContext((ctx) => {
      const index = getSheetIndex(ctx, ctx.currentSheetId);
      if (_.isNil(index)) return;
      const selectedFormatVal = toolbarFormat[selectedFormatIndex].value;

      let selectedFormatPos: string;
      if ("pos" in toolbarFormat[selectedFormatIndex])
        selectedFormatPos = toolbarFormat[selectedFormatIndex].pos || "before";

      _.forEach(ctx.luckysheet_select_save, (selection) => {
        for (let r = selection.row[0]; r <= selection.row[1]; r += 1) {
          for (let c = selection.column[0]; c <= selection.column[1]; c += 1) {
            if (
              ctx.luckysheetfile[index].data?.[r][c] &&
              ctx.luckysheetfile[index].data?.[r][c]?.ct?.t === "n"
            ) {
              const zero = 0;
              if (selectedFormatPos === "after") {
                ctx.luckysheetfile[index].data![r][c]!.ct!.fa = zero
                  .toFixed(decimalPlace)
                  .concat(`${selectedFormatVal}`);
                ctx.luckysheetfile[index].data![r][c]!.m = update(
                  zero.toFixed(decimalPlace).concat(`${selectedFormatVal}`),
                  ctx.luckysheetfile[index].data![r][c]!.v
                );
              } else {
                ctx.luckysheetfile[index].data![r][c]!.ct!.fa =
                  `${selectedFormatVal}`.concat(zero.toFixed(decimalPlace));
                ctx.luckysheetfile[index].data![r][c]!.m = update(
                  `${selectedFormatVal}`.concat(zero.toFixed(decimalPlace)),
                  ctx.luckysheetfile[index].data![r][c]!.v
                );
              }
            }
          }
        }
      });
      _onCancel();
    });
  }, [
    _onCancel,
    decimalPlace,
    format.tipDecimalPlaces,
    selectedFormatIndex,
    setContext,
    showDialog,
    toolbarFormat,
  ]);

  const onCancel = useCallback(() => {
    setContext((ctx) => {
      cancelNormalSelected(ctx);
      if (cellInput.current) {
        cellInput.current.innerHTML = "";
      }
    });
    _onCancel();
  }, [_onCancel, cellInput, setContext]);

  return (
    <div id="luckysheet-search-format">
      <div className="listbox" style={{ height: 200 }}>
        <div style={{ marginBottom: 16 }}>
          {tips}
          {format.format}：
        </div>
        <div className="inpbox" style={{ display: "block" }}>
          {format.decimalPlaces}：
          <input
            className="decimal-places-input"
            id="decimal-places-input"
            min={0}
            max={9}
            defaultValue={2}
            type="number"
            onChange={(e) => {
              setDecimalPlace(parseInt(e.target.value, 10));
            }}
          />
        </div>
        <div className="format-list">
          {toolbarFormat.map((v: any, index: number) => (
            <div
              className={`listBox${index === selectedFormatIndex ? " on" : ""}`}
              key={v.name}
              onClick={() => {
                setSelectedFormatIndex(index);
              }}
              tabIndex={0}
            >
              <div>{v.name}</div>
              <div>{v.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="fortune-dialog-box-button-container"
        style={{ marginTop: 40 }}
      >
        <div
          className="fortune-message-box-button button-primary"
          onClick={onConfirm}
          tabIndex={0}
        >
          {button.confirm}
        </div>
        <div
          className="fortune-message-box-button button-default"
          onClick={onCancel}
          tabIndex={0}
        >
          {button.cancel}
        </div>
      </div>
    </div>
  );
};
