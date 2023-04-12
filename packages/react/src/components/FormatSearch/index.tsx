import React, { useContext, useState, useCallback, useMemo } from "react";
import {
  cancelNormalSelected,
  getSheetIndex,
  locale,
  update,
} from "@fortune-sheet/core";
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
  const { button, format, currencyDetail, dateFmtList } = locale(context);
  const { showDialog } = useDialog();
  const toolbarFormatAll = useMemo(
    () => ({
      currency: currencyDetail,
      date: dateFmtList,
      number: [], // has not been defined
    }),
    [currencyDetail, dateFmtList]
  );
  const toolbarFormat = useMemo(
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
      const selectedFormat = toolbarFormat[selectedFormatIndex].value;
      _.forEach(ctx.luckysheet_select_save, (selection) => {
        for (let r = selection.row[0]; r <= selection.row[1]; r += 1) {
          for (let c = selection.column[0]; c <= selection.column[1]; c += 1) {
            if (
              ctx.luckysheetfile[index].data?.[r][c] &&
              ctx.luckysheetfile[index].data?.[r][c]?.ct?.t === "n"
            ) {
              const zero = 0;
              ctx.luckysheetfile[index].data![r][c]!.ct!.fa =
                `${selectedFormat}`.concat(zero.toFixed(decimalPlace));
              ctx.luckysheetfile[index].data![r][c]!.m = update(
                `${selectedFormat}`.concat(zero.toFixed(decimalPlace)),
                ctx.luckysheetfile[index].data![r][c]!.v
              );
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
        <div
          className="inpbox"
          style={
            type === "currency" ? { display: "block" } : { display: "none" }
          }
        >
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
            >
              <div>{v.name}</div>
              <div>{v.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="fortune-dialog-box-button-container"
        style={type === "currency" ? { marginTop: 40 } : { marginTop: 30 }}
      >
        <div
          className="fortune-message-box-button button-primary"
          onClick={onConfirm}
        >
          {button.confirm}
        </div>
        <div
          className="fortune-message-box-button button-default"
          onClick={onCancel}
        >
          {button.cancel}
        </div>
      </div>
    </div>
  );
};
