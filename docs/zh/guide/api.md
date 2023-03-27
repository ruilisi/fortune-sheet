# API

API 可通过 `Workbook` 的 `ref` 暴露出来.

```tsx
const ref = useRef<WorkbookInstance>(null);

<Workbook ref={ref} ... />
```

## 概览

| API | 描述 |
| ----- | ----------- |
| [applyOp](#applyop) | 在workbook上应用一组OP |
| [getCellValue](#getcellvalue) | 获取一个单元格的值 |
| [setCellValue](#setcellvalue) | 设置一个单元格的值 |
| [clearCell](#clearcell) | 清除一个单元格的内容 |
| [setCellFormat](#setcellformat) | 设置单元格属性 |
| [autoFillCell](#autofillcell) | 自动填充单元格 |
| [freeze](#freeze) | 冻结行/列 |
| [insertRowOrColumn](#insertroworcolumn) | 在指定位置插入行/列 |
| [deleteRowOrColumn](#deleteroworcolumn) | 删除指定范围的行/列 |
| [getRowHeight](#getrowheight) | 获取一批行高 |
| [getColumnWidth](#getcolumnwidth) | 获取一批列宽 |
| [setRowHeight](#setrowheight) | 设置一批行高 |
| [setColumnWidth](#setcolumnwidth) | 设置一批列宽 |
| [setSelection](#setselection) | 设置选取范围 |
| [getFlattenRange](#getflattenrange) | 将给定范围转换成多个单元格坐标 |
| [getCellsByFlattenRange](#getcellsbyflattenrange) | 将单元格坐标映射到单元格对象 |
| [getSelectionCoordinates](#getselectioncoordinates) | 获取选择坐标的文本表示列表 |
| [getCellsByRange](#getcellsbyrange) | 将范围映射到单元格对象 |
| [getHtmlByRange](#gethtmlbyrange) | 获取指定范围的 html 形式内容 |
| [mergeCells](#mergecells) | 根据范围和类型合并选区 |
| [cancelMerge](#cancelmerge) | 取消一个合并区域 |
| [getAllSheets](#getallsheets) | 获取所有表的原始数据 |
| [getSheet](#getsheet) | 获得一张表的原始数据 |
| [addSheet](#addsheet) | 新增一张表格 |
| [deleteSheet](#deletesheet) | 删除指定表格 |
| [updateSheet](#updatesheet) | 根据指定的数据更新表格 |
| [activateSheet](#activatesheet) | 将指定表格设置为当前表 |
| [setSheetName](#setsheetname) | 设置指定表的表名 |
| [setSheetOrder](#setsheetorder) | 设置表格顺序 |
| [scroll](#scroll) | 滑动到当前表的指定位置 |
| [addPresence](#addpresence) | 添加协作者表现 |
| [removePresence](#removepresence) | 删除协作者表现 |
| [undo](#undo) | 撤销 |
| [redo](#redo) | 重做 |

---

### CommonOptions

许多API都有一个可选参数 `options` ，这主要是给用户选择表格时使用的

| 参数 | 类型 | 描述 |
| ----- | ---- | ------ |
| index | number | 表格在整体中的序号 |
| id | string | 表格的id，如果有index值，id就不会生效 |

---

### applyOp

_applyOp(ops)_

应用op至Workbook。

通常用于在线协同场景，用来同步数据。

更多可见 [Collabration demo](https://github.com/ruilisi/fortune-sheet/blob/master/stories/Collabration.stories.tsx) for an example usage.

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| ops | Op[] | 当前操作的op列表 |

---

### getCellValue

_getCellValue(row, column, [options]) -> any_

获取指定单元格的值

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| row | number | 单元格所在行数；从0开始的整数，0表示第一行 |
| column | number | 单元格所在列数；从0开始的整数，0表示第一列 |
| [options] | [可选参数](#commonoptions) & { type: string } | `type`: 单元格属性，默认是'v' |

**Returns** 指定的单元格属性，如果`options.type`没有被指定，则会返回单元格的`v`值。

  特殊情况，单元格格式为`yyyy-MM-dd`，`type`为`'v'`时会强制取`'m'`显示值。

- **示例**:

  - 返回当前工作表第1行第1列单元格的数据的v值

    `workboobRef.current.getCellValue(0, 0)`

  - 返回指定data数据的第2行第2列单元格的显示值。

    `workboobRef.current.getCellValue(1, 1, {type:"m"})`

---

### setCellValue

_setCellValue(row, column, value, [options])_

设置某个单元格的值，也可以设置整个单元格对象，用于同时设置多个单元格属性。

| 参数 | 类型 | 描述 |
| --- | --- | --- |
| row | number | 行index |
| column | number | 列index |
| value | any | 要设置的值 |
| [options] | [可选参数](#commonoptions) & { type: string } | `type`: 单元格属性，默认是'v' |

如果需要更新公式，也可以在这里赋值，fortune-sheet在内部会主动把这个公式做计算并加入到公式链中，最后重刷计算。

- **示例**:

  - 设置当前工作表"A1"单元格的值为"1"    `workbookRef.current.setCellValue(0, 0, 1);`

  - 设置当前工作表"B1"单元格的值为公式"=sum(A1)"    `workbookRef.current.setCellValue(0, 1, "=sum(A1)");`

  - 设置当前工作表"C1"单元格的值为公式"=sum(A1:B1)"，并带有红色背景，单元格对象可以不带`v`和`m`值，fortune-sheet会根据公式信息自动计算结果，如果带了未更新或者是非公式结果的`v`和`m`值，fortune-sheet也仍然会根据公式实际关联的数据计算出准备的结果。    `workbookRef.current.setCellValue(0, 2, {f: "=sum(A1:B1)", bg:"#FF0000"})`

    再次设置"C1"单元格新的公式仍然可以生效

    `worksheetRef.current.setCellValue(0, 2, {f: "=sum(A1)", bg:"#00FF00"})`

---

### clearCell

_clearCell(row, column, [options])_

清除指定工作表指定单元格的内容

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| row | number | 行index |
| column | number | 列index |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

- **示例**:

  - 清空单元格`B2`内容 `workbookRef.current.clearCell(1,1)`

---

### setCellFormat

_setCellFormat(row, column, attr, value [,option])_

设置某个单元格的属性，如果要设置单元格的值或者同时设置多个单元格属性，推荐使用`setCellValue`

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| row | number | 行index |
| column | number | 列index |
| attr | string, number, object | 属性类型，参考 [单元格属性表](./cell.md)的属性值 |
| value | any | 对应属性要被设置的值 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

- **说明**：

  特殊的设置

  边框设置时，attr为`"bd"`，value为一个key/value对象，需要同时设置边框类型:`borderType`/边框粗细:`style`/边框颜色:`color`，比如设置A1单元格的边框为所有/红色/细：

  `luckysheet.setCellFormat(0, 0, "bd", {borderType: "border-right",style: "1", color: "#ff0000"})`

  完整可选的设置参数如下：

  - 边框类型 borderType："border-left" | "border-right" | "border-top" | "border-bottom" | "border-all" | "border-outside" | "border-inside" | "border-horizontal" | "border-vertical" | "border-none" | "border-slash"，
  - 边框粗细 style: 1 Thin | 2 Hair | 3 Dotted | 4 Dashed | 5 DashDot | 6 DashDotDot | ~~7 Double~~ | 8 Medium | 9 MediumDashed | 10 MediumDashDot | 11 MediumDashDotDot | ~~12 SlantedDashDot~~ | 13 Thick
  - 边框颜色 `color: 16进制颜色值`

---

### autoFillCell

_autoFillCell(copyRange, applyRange, direction)_

根据`copyRange`的内容自动填充`applyRange`的内容。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| copyRange | { row: number[], column: number[] } | 参考范围 |
| applyRange | { row: number[], column: number[] } | 目标范围 |
| direction | "up", "down", "left", "right"之一 | 填充方向 |

---

### freeze

_freeze(type, range, [options])_

冻结行/列

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| type | string | "row", "column", "both" 之一 |
| range | { row: number, column: number } | `row`: 要冻结的 row index<br>`column`: 要冻结的 column index |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### insertRowOrColumn

_insertRowOrColumn(type, index, count, direction, [options])_

在指定位置插入行/列

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| type | string | "row"或"column" |
| index | number | 插入位置的起始行或列的 index  |
| count | number | 要插入的行或列的数量 |
| direction | string | 'lefttop' or 'rightbottom' 之一，默认是 'rightbottom'.<br>`lefttop`: 在 `index` 行上方或 `index` 列左侧插入行/列。<br>`rightbottom`: 在 `index` 行下方或 `index` 列右侧插入行/列。 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### deleteRowOrColumn

_deleteRowOrColumn(type, start, end, [options])_

删除指定范围内的行/列

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| type | string | "row"或"column" |
| start | number | 要删除位置的起始行/列 |
| end | number | 要删除位置的结束行/列 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### getRowHeight

_getRowHeight(rows, [options])_

获取一组行高

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| rows | number[] | 一组行 indexe, 如 [1, 4] |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Returns** 一组行高map { "1": 150, "4": 200 }。

----

### getColumnWidth

_getColumnWidth(columns, [options])_

获取一组列宽

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| columns | number[] | 一组列 indexe, 如 [1, 4] |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Returns** 一组列宽map { "1": 150, "4": 200 }。

----

### setRowHeight

_setRowHeight(rowInfo, [options])_

设置一组行高

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| rowInfo | object | 一组列宽map，[row index]: height.<br>例如: { "1": 150, "4": 200 } 表示将第二行的行高设置为150，第五行的行高设置为200 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

----

### setColumnWidth

_setColumnWidth(columnInfo, [options])_

设置一组列宽

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| columnInfo | object | 一组列宽map，[column index]: width.<br>例如: { "1": 150, "4": 200 } 表示将第二列的列宽设置为150，第五行的行高设置为200 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

----

### getSelection

_getSelection()_

获取当前选区

**Returns** 当前选区的列表。

---

### setSelection

_setSelection(range, [options])_

设置选区

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] } | 选区列表 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### getFlattenRange

_getFlattenRange(range)_

将给定的范围转化为单元格坐标

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] } | 一个范围对象 |

**Returns** 一组单元格坐标列表。

  - **示例**:

    输入:
    ```
    {"row": [0, 1], "column": [0, 2]}
    ```

    输出:
    ```
    [
      {"r": 0, "c": 0},
      {"r": 0, "c": 1},
      {"r": 0, "c": 2},
      {"r": 1, "c": 0},
      {"r": 1, "c": 1},
      {"r": 1, "c": 2},
    ]
    ```

---

### getCellsByFlattenRange

_getCellsByFlattenRange(range)_

将一组单元格坐标转换为选区范围数组

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| range | { r: number, c: number }[] | 一组单元格坐标 |

**Returns** 根据单元格坐标转换的选区范围数组。

---

### getSelectionCoordinates

_getSelectionCoordinates()_

获取选区单元格标识

样例输出：

```json
["E10:E14", "A7:B13", "C4", "A3", "C6:D9"]
```

### getCellsByRange

_getCellsByRange(range, [options])_

将选取数组转化为单元格对象

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] }[] | 一组选区数组 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Returns** 指定范围内的单元格对象。

---

### getHtmlByRange

_getHtmlByRange(range, [options])_

获取制定选区的html形式的数据，通常是用于粘贴进Excel应用

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] }[] | 一组选区数组 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Returns** HTML字符串。

---

### setCellValuesByRange

_setCellValuesByRange(data, range, [options])_

类似 `setCellValue`, 但是可以一次性设置多个单元格值

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| data | any[][] | 表示单元格值的二维数组 |
| range | { row: number[], column: number[] } | 要设置的单元格范围 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Note**: `data` 和 `range` 的大小必须相同。

---

### setCellFormatByRange

_setCellFormatByRange(attr, value, range, [options])_

类似 `setCellFormat`, 但是可以一次性设置多个单元格格式

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| attr | string | 单元格属性 |
| value | any | 要设置的单元格 `attr` |
| range | { row: number[], column: number[] } | 要设置的单元格范围 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### mergeCells

_mergeCells(ranges, type, [options])_

根据ranges和type合并单元格

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| ranges | { row: number[], column: number[] }[] | 一组将要合并的单元格的列表 |
| type | string | "merge-all", "merge-horizontal", "merge-vertical" 之一 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### cancelMerge

_cancelMerge(ranges, [options])_

取消一个范围的合并单元格

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| ranges | { row: number[], column: number[] }[] | 一组要取消合的单元格范围 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### getAllSheets

_getAllSheets()_

**Returns** 所有表的原始数据，表内数据为`data`形式。

---


### getSheet

_getSheet(options)_

获取一张表的初始数据

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

**Returns** 指定表的原始数据，表内数据为`data`形式。


---

### addSheet

_addSheet()_

向workbook内新增一张表。

---

### deleteSheet

_deleteSheet(options)_

删除指定表。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### updateSheet

_updateSheet(sheet[])_

使用指定数据生成表

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| sheet | [Sheet](./sheet.md)[] | 表格信息数组 |

你可以使用 `celldata` 或 `data` 来声明表格数据, 推荐使用 `celldata`。

---

### activateSheet

_activateSheet(options)_

更改当前的工作表。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |


---

### setSheetName

_setSheetName(name, options)_

设置指定表的表名。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| name | string | 要设置的表名 |
| [options] | [CommonOptions](#commonoptions) | 通用参数 |

---

### setSheetOrder

_setSheetOrder(orderList)_

设置表顺序。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| orderList | object | 一个map，键: sheet id, 值: order number |

样例输入:

```json

{
	"id_of_sheet_1": 1,
	"id_of_sheet_2": 0,
	"id_of_sheet_3": 2
}
```

---

### scroll

_scroll(options)_

将当前表滚动到指定位置。

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| options | { scrollLeft?: number, scrollTop?: number, targetRow?: number, targetColumn?: number } | 需要滚动到的位置，所有参数都是可选的 |

---

### addPresence

_addPresence(presence)_

添加协作者状态，将显示协作者聚焦的单元格

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| presence | Presence | 一个 `Presence` 对象 |

`Presence` 对象:

| 属性 | 类型 | 描述 |
| ----- | ----- | ------ |
| sheetId | string | 表id |
| username | string | 需要再表格上展示的用户名 |
| userId | string | (可选) 用户标识，如果未设置则使用 `username` |
| color | string | 聚焦框颜色 |
| selection | { r: number, c: number } | 聚焦框位置 |

---

### removePresence

_removePresence(presence)_

移除协作者状态

| 参数 | 类型 | 描述 |
| ----- | ----- | ------ |
| presence | Presence | 一个 `Presence` 对象, 详见 [addPresence](#addpresence), 但是只需 `username` 或 `userId` |

---

### undo

_undo()_

撤销上一步

---

### redo

_redo()_

重做上一步

---​    

使用例子请查看 [Collabration demo](https://github.com/ruilisi/fortune-sheet/blob/master/stories/Collabration.stories.tsx).


---

更多 API 敬请期待。