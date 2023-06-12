import {
  Context,
  getSheetIndex,
  indexToColumnChar,
  locale,
  sortSelection,
} from "@fortune-sheet/core";
import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import _ from "lodash";
import WorkbookContext from "../../context";
import "./index.css";
import { useDialog } from "../../hooks/useDialog";

type RadioChangeEvent = React.ChangeEvent<HTMLInputElement>;

const CustomSort: React.FC<{}> = () => {
  const [rangeColChar, setRangeColChar] = useState<String[]>([]);
  const [ascOrDesc, setAscOrDesc] = useState(true);
  const { context, setContext } = useContext(WorkbookContext);
  const [selectedValue, setSelectedValue] = useState<string>("0");
  const [isTitleChange, setIstitleChange] = useState(false);
  const { sort } = locale(context);
  const { hideDialog } = useDialog();

  const col_start = context.luckysheet_select_save![0].column[0];
  const col_end = context.luckysheet_select_save![0].column[1];
  const row_start = context.luckysheet_select_save![0].row[0];
  const row_end = context.luckysheet_select_save![0].row[1];

  const sheetIndex = getSheetIndex(context, context.currentSheetId) as number;

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

  // 改变排序方式
  const handleRadioChange = useCallback((e: RadioChangeEvent) => {
    const sortValue = e.target.value;
    setAscOrDesc(() => {
      if (sortValue === "asc") {
        return true;
      }
      return false;
    });
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      setIstitleChange(value);
    },
    []
  );

  // 获取排序列
  useEffect(() => {
    setRangeColChar([]);
    if (isTitleChange) {
      for (let i = col_start; i <= col_end; i += 1) {
        // 判断列首是否为空
        if (
          !_.isNil(context.luckysheetfile[sheetIndex].data![row_start][i]?.v)
        ) {
          const colHeaderValue = context.luckysheetfile[sheetIndex].data![
            row_start
          ][i]!.v as string;
          setRangeColChar((prevArray) => [...prevArray, colHeaderValue]);
        } else {
          const ColumnChar = indexToColumnChar(i);
          setRangeColChar((prevArray) => [...prevArray, `列${ColumnChar}`]);
        }
      }
    } else {
      for (let i = col_start; i <= col_end; i += 1) {
        const ColumnChar = indexToColumnChar(i);
        setRangeColChar((prevArray) => [...prevArray, ColumnChar]);
      }
    }
  }, [
    col_end,
    col_start,
    context.luckysheetfile,
    isTitleChange,
    row_start,
    sheetIndex,
  ]);

  return (
    <div className="fortune-sort">
      <div className="fortune-sort-title">
        <span>
          <span>{sort.sortRangeTitle}</span>
          {indexToColumnChar(col_start)}
          {row_start + 1}
          <span>{sort.sortRangeTitleTo}</span>
          {indexToColumnChar(col_end)}
          {row_end + 1}
        </span>
      </div>

      <div>
        <div className="fortune-sort-modal">
          <div>
            <input
              type="checkbox"
              id="fortune-sort-haveheader"
              onChange={handleTitleChange}
            />
            <span>{sort.hasTitle}</span>
          </div>

          <div className="fortunne-sort-tablec">
            <table cellSpacing="0">
              <tbody>
                <tr>
                  <td style={{ width: "190px" }}>
                    {sort.sortBy}
                    <select name="sort_0" onChange={handleSelectChange}>
                      {rangeColChar.map((col, index) => {
                        return (
                          <option value={index} key={index}>
                            {col}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td>
                    <div>
                      <input
                        type="radio"
                        value="asc"
                        defaultChecked
                        name="sort_0"
                        onChange={handleRadioChange}
                      />
                      <span>{sort.asc}</span>
                    </div>
                    <div>
                      <input
                        type="radio"
                        value="desc"
                        name="sort_0"
                        onChange={handleRadioChange}
                      />
                      <span>{sort.desc}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fortune-sort-button">
        <div
          className="button-basic button-primary"
          onClick={() => {
            setContext((draftCtx: Context) => {
              sortSelection(draftCtx, ascOrDesc, parseInt(selectedValue, 10));
              draftCtx.contextMenu = {};
            });
            hideDialog();
          }}
        >
          {sort.confirm}
        </div>
      </div>
    </div>
  );
};

export default CustomSort;
