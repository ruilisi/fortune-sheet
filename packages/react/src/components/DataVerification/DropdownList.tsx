import {
  getCellValue,
  getDropdownList,
  getFlowdata,
  getSheetIndex,
  mergeBorder,
  setDropcownValue,
} from "@jadinec/core-sheet";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WorkbookContext from "../../context";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import SVGIcon from "../SVGIcon";

import "./index.css";

interface IDropDownListProps {
  width?: number | undefined;
}

const DropDownList: React.FC<IDropDownListProps> = (
  props: IDropDownListProps
) => {
  const { width } = props;
  const { context, setContext } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<any[]>([]);
  const [isMul, setIsMul] = useState<boolean>(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [selected, setSelected] = useState<any[]>([]);

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.dataVerificationDropDownList = false;
    });
  }, [setContext]);

  useOutsideClick(containerRef, close, [close]);

  const showList = useMemo(() => {
    if (context.editValue) {
      return [...list].filter((el) => el.includes(context.editValue!));
    }
    return list;
  }, [context.editValue, list]);

  // 初始化
  useEffect(() => {
    if (!context.luckysheet_select_save) return;
    const last =
      context.luckysheet_select_save[context.luckysheet_select_save.length - 1];
    const rowIndex = last.row_focus;
    const colIndex = last.column_focus;
    if (rowIndex == null || colIndex == null) return;
    let row = context.visibledatarow[rowIndex];
    let col_pre = colIndex === 0 ? 0 : context.visibledatacolumn[colIndex - 1];
    const d = getFlowdata(context);
    if (!d) return;
    const margeSet = mergeBorder(context, d, rowIndex, colIndex);
    if (margeSet) {
      [, row] = margeSet.row;
      [col_pre, ,] = margeSet.column;
    }
    const index = getSheetIndex(context, context.currentSheetId) as number;
    const { dataVerification } = context.luckysheetfile[index];
    const item = dataVerification[`${rowIndex}_${colIndex}`];
    const dropdownList = getDropdownList(context, item.value1);
    // 初始化多选的下拉列表
    const cellValue = getCellValue(rowIndex, colIndex, d);

    if (cellValue) {
      setSelected(cellValue.toString().split(","));
    }
    setList(dropdownList);
    setPosition({
      left: col_pre,
      top: row,
    });
    setIsMul(item.type2 === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 设置下拉列表的值
  useEffect(() => {
    if (!context.luckysheet_select_save) return;
    const last =
      context.luckysheet_select_save[context.luckysheet_select_save.length - 1];
    const rowIndex = last.row_focus;
    const colIndex = last.column_focus;
    if (rowIndex == null || colIndex == null) return;
    const index = getSheetIndex(context, context.currentSheetId) as number;
    const { dataVerification } = context.luckysheetfile[index];
    const item = dataVerification[`${rowIndex}_${colIndex}`];
    if (item.type2 !== "true") return;
    const d = getFlowdata(context);
    if (!d) return;
    const cellValue = getCellValue(rowIndex, colIndex, d);
    if (cellValue) {
      setSelected(cellValue.toString().split(","));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheetfile]);

  return (
    <div
      id="luckysheet-dataVerification-dropdown-List"
      style={width ? { ...position, width } : { ...position }}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      tabIndex={0}
    >
      {showList.map((v, i) => (
        <div
          className="dropdown-List-item"
          key={i}
          onClick={() => {
            setContext((ctx) => {
              const arr = selected;
              const index = arr.indexOf(v);
              if (index < 0) {
                arr.push(v);
              } else {
                arr.splice(index, 1);
              }
              setSelected(arr);
              setDropcownValue(ctx, v, arr);
              ctx.updateTime = Date.now().toString();
            });
          }}
          tabIndex={0}
        >
          <SVGIcon
            name="check"
            width={12}
            style={{
              verticalAlign: "middle",
              display: isMul && selected.indexOf(v) >= 0 ? "inline" : "none",
            }}
          />
          {v}
        </div>
      ))}
    </div>
  );
};
export default DropDownList;
