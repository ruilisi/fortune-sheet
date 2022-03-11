import {
  colLocation,
  colLocationByIndex,
} from "@fortune-sheet/core/src/modules/location";
import {
  selectTitlesMap,
  selectTitlesRange,
} from "@fortune-sheet/core/src/modules/selection";
import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import WorkbookContext from "../../context";

const ColumnHeader: React.FC = () => {
  const { context } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverLocation, setHoverLocation] = useState({
    col: -1,
    col_pre: -1,
  });
  const [selectedLocation, setSelectedLocation] = useState<
    { col: number; col_pre: number }[]
  >([]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      const x = e.nativeEvent.offsetX - containerRef.current!.scrollLeft;
      const col_location = colLocation(x, context.visibledatacolumn);
      const [col_pre, col] = col_location;
      setHoverLocation({ col_pre, col });
    },
    [context]
  );

  useEffect(() => {
    const s = context.luckysheet_select_save;
    let columnTitleMap = {};
    for (let i = 0; i < s.length; i += 1) {
      const c1 = s[i].column[0];
      const c2 = s[i].column[1];
      columnTitleMap = selectTitlesMap(columnTitleMap, c1, c2);
    }
    const columnTitleRange = selectTitlesRange(columnTitleMap);
    const selects: { col: number; col_pre: number }[] = [];
    for (let j = 0; j < columnTitleRange.length; j += 1) {
      const c1 = columnTitleRange[j][0];
      const c2 = columnTitleRange[j][columnTitleRange[j].length - 1];
      const col = colLocationByIndex(c2, context.visibledatacolumn)[1];
      const col_pre = colLocationByIndex(c1, context.visibledatacolumn)[0];
      selects.push({ col, col_pre });
    }
    setSelectedLocation(selects);
  }, [context.luckysheet_select_save, context.visibledatacolumn]);

  return (
    <div
      ref={containerRef}
      className="fortune-col-header"
      style={{
        height: context.columnHeaderHeight - 1.5,
      }}
      onMouseMove={onMouseMove}
    >
      {hoverLocation.col >= 0 && hoverLocation.col_pre >= 0 ? (
        <div
          className="fortune-col-header-hover"
          style={{
            left: hoverLocation.col_pre,
            width: hoverLocation.col - hoverLocation.col_pre - 1,
            display: "block",
          }}
        />
      ) : null}
      {selectedLocation.map(({ col, col_pre }, i) => (
        <div
          className="fortune-col-header-selected"
          key={i}
          style={{
            left: col_pre,
            width: col - col_pre - 1,
            display: "block",
            backgroundColor: "rgba(76, 76, 76, 0.1)",
          }}
        />
      ))}
    </div>
  );
};

export default ColumnHeader;
