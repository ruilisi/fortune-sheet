import {
  getDataArr,
  getFlowdata,
  getRegStr,
  locale,
  updateMoreCell,
} from "@fortune-sheet/core";
import _ from "lodash";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import "./index.css";

export const SplitColumn: React.FC<{}> = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { splitText, button } = locale(context);
  const [splitOperate, setSplitOperate] = useState("");
  const [otherFlag, setOtherFlag] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([]);
  const splitSymbols = useRef<HTMLDivElement>(null);
  const { showDialog, hideDialog } = useDialog();

  // 确定按钮
  const certainBtn = useCallback(() => {
    hideDialog();
    const dataArr = getDataArr(splitOperate, context);
    const r = context.luckysheet_select_save![0].row[0];
    const c = context.luckysheet_select_save![0].column[0];
    if (dataArr[0].length === 1) {
      return;
    }
    let dataCover = false;
    const data = getFlowdata(context);
    for (let i = 0; i < dataArr.length; i += 1) {
      for (let j = 1; j < dataArr[0].length; j += 1) {
        const cell = data![r + i][c + j];
        if (!_.isNull(cell) && !_.isNull(cell.v)) {
          dataCover = true;
          break;
        }
      }
    }
    if (dataCover) {
      showDialog(splitText.splitConfirmToExe, "yesno", () => {
        hideDialog();
        setContext((ctx) => {
          updateMoreCell(r, c, dataArr, ctx);
        });
      });
    } else {
      setContext((ctx) => {
        updateMoreCell(r, c, dataArr, ctx);
      });
    }
  }, [
    context,
    hideDialog,
    setContext,
    showDialog,
    splitOperate,
    splitText.splitConfirmToExe,
  ]);

  // 数据预览
  useEffect(() => {
    setTableData((table) => {
      table = getDataArr(splitOperate, context);
      return table;
    });
  }, [context, splitOperate]);

  return (
    <div id="fortunesheet-split-column">
      <div className="title">{splitText.splitTextTitle}</div>
      <div className="splitDelimiters">{splitText.splitDelimiters}</div>
      <div className="splitSymbols" ref={splitSymbols}>
        {splitText.splitSymbols.map((o) => (
          <div key={o.value} className="splitSymbol">
            <input
              id={o.value}
              name={o.value}
              type="checkbox"
              onClick={() =>
                setSplitOperate((regStr) => {
                  return getRegStr(regStr, splitSymbols.current?.childNodes);
                })
              }
            />
            <label htmlFor={o.value}>{o.name}</label>
          </div>
        ))}
        <div className="splitSymbol">
          <input
            id="other"
            name="other"
            type="checkbox"
            onClick={() => {
              setOtherFlag(!otherFlag);
              setSplitOperate((regStr) => {
                return getRegStr(regStr, splitSymbols.current?.childNodes);
              });
            }}
          />
          <label htmlFor="other">{splitText.splitOther}</label>
          <input
            id="otherValue"
            name="otherValue"
            type="text"
            onBlur={() => {
              if (otherFlag) {
                setSplitOperate((regStr) => {
                  return getRegStr(regStr, splitSymbols.current?.childNodes);
                });
              }
            }}
          />
        </div>
        <div className="splitSymbol splitSimple">
          <input
            id="splitsimple"
            name="splitsimple"
            type="checkbox"
            onClick={() => {
              setSplitOperate((regStr) => {
                return getRegStr(regStr, splitSymbols.current?.childNodes);
              });
            }}
          />
          <label htmlFor="splitsimple">{splitText.splitContinueSymbol}</label>
        </div>
      </div>
      <div className="splitDataPreview">{splitText.splitDataPreview}</div>
      <div className="splitColumnData">
        <table>
          <tbody>
            {tableData.map((o, index) => {
              if (o.length >= 1) {
                return (
                  <tr key={index}>
                    {o.map((o1: string) => (
                      <td>{o1}</td>
                    ))}
                  </tr>
                );
              }
              return (
                <tr>
                  <td />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        className="button-basic button-primary"
        onClick={() => {
          certainBtn();
        }}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          hideDialog();
        }}
      >
        {button.cancel}
      </div>
    </div>
  );
};
