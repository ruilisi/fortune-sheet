# API

API is avaible via the `ref` of `Workbook`

```tsx
const ref = useRef<WorkbookInstance>(null);

<Workbook ref={ref} ... />
```

## Overview

| API | Description |
| ----- | ----------- |
| [applyOp](#applyop) | Applys an array of op to the workbook |
| [getCellValue](#getcellvalue) | Gets the value of a cell |
| [setCellValue](#setcellvalue) | Sets the value of a cell |
| [clearCell](#clearcell) | Clear the contents of the cell |
| [setCellFormat](#setcellformat) | Sets the attributes of a cell |
| [autoFillCell](#autofillcell) | Auto fill the value of a batch |
| [freeze](#freeze) | Freezes row and column |
| [insertRowOrColumn](#insertroworcolumn) | Inserts rows or columns at specified position |
| [deleteRowOrColumn](#deleteroworcolumn) | Deletes rows or columns at specified range |
| [getRowHeight](#getrowheight) | Gets row heights in batch |
| [getColumnWidth](#getcolumnwidth) | Gets column widths in batch |
| [setRowHeight](#setrowheight) | Sets row heights in batch |
| [setColumnWidth](#setcolumnwidth) | Sets column widths in batch |
| [getSelection](#getselection) | Gets current selection |
| [setSelection](#setselection) | Sets a selected range to the sheet |
| [getFlattenRange](#getflattenrange) | Expands given range to cells coordinates |
| [getCellsByFlattenRange](#getcellsbyflattenrange) | Maps cell coordinations to cell objects |
| [getSelectionCoordinates](#getselectioncoordinates) | Gets a list of text representation of selection coordinates |
| [getCellsByRange](#getcellsbyrange) | Maps range to cell objects |
| [getHtmlByRange](#gethtmlbyrange) | Gets a html representation of the specified range |
| [mergeCells](#mergecells) | Merges cells according to range and type |
| [cancelMerge](#cancelmerge) | Cancels merge on a range |
| [getAllSheets](#getallsheets) | Gets all sheets' raw data |
| [getSheet](#getsheet) | Gets a sheet's raw data |
| [addSheet](#addsheet) | Adds a new sheet to the workbook |
| [deleteSheet](#deletesheet) | Deletes the specified sheet |
| [updateSheet](#updatesheet) | Update sheet with specified data |
| [activateSheet](#activatesheet) | Changes the current working sheet to the specified sheet |
| [setSheetName](#setsheetname) | Sets the name of the specified sheet |
| [setSheetOrder](#setsheetorder) | Sets the orders of the sheets |
| [scroll](#scroll) | Scroll the current sheet to specified position |
| [addPresence](#addpresence) | Add a collabrator presence |
| [removePresence](#removepresence) | Removes a collabrator presence |
| [undo](#undo) | Undo one step |
| [redo](#redo) | Undo one step |

---

### CommonOptions

Many APIs has an optional `options` param in the end, it is mainly used for selecting sheet.

| Param | Type | Description |
| ----- | ---- | ------ |
| index | number | index of sheet in the workbook |
| id | string | id of sheet in the workbook, if index is set, this field does not take effect |

---

### applyOp

_applyOp(ops)_

Applys an array of op to the workbook.

This api is typically used in online collabration to sync data.

See [Collabration demo](https://github.com/eoncn/online-sheet/blob/master/stories/Collabration.stories.tsx) for an example usage.

| Param | Type | Description |
| ----- | ----- | ------ |
| ops | Op[] | op list of current action |


---

### getCellValue

_getCellValue(row, column, [options]) -> any_

Gets the value of a cell.

| Param | Type | Description |
| ----- | ----- | ------ |
| row | number | Row index |
| column | number | Column index |
| [options] | [CommonOptions](#commonoptions) & { type: string } | `type`: attribute of a Cell, default to 'v' |

**Returns** the specified field of a cell, if `options.type` is not set, returns the value of `v` of the Cell.

	In special cases, when the cell format is `yyyy-MM-dd` and `type` is `'v'`, the displayed value of `'m'` will be forced.

- **Example**

  - Returns the v value of the data in the cell in row 1, column 1 of the current worksheet

		`workboobRef.current.getCellValue(0, 0)`

  - Returns the displayed value of the cell in row 2, column 2 of the specified data.

		`workboobRef.current.getCellValue(1, 1, {type:"m"})`

---

### setCellValue

_setCellValue(row, column, value, [options])_

Sets the value of a cell.

| Param | Type | Description |
| ----- | ----- | ------ |
| row | number | Row index |
| column | number | Column index |
| value | any | value to be set |
| [options] | [CommonOptions](#commonoptions) & { type: string } | `type`: attribute of a Cell, default to 'v' |

- **Example**

	- Set the value of cell "A1" in the current worksheet to "1"		`workbookRef.current.setCellValue(0, 0, 1);`

	- Set the value of cell "B1" in the current worksheet to the formula "=sum(A1)"		`workbookRef.current.setCellValue(0, 1, "=sum(A1)");`

	- Set the value of the cell "C1" in the current worksheet to the formula "=sum(A1:B1)" with a red background, the cell object can be without `v` and `m` values, online-sheet will automatically calculate the results based on the formula. If there are `v` and `m` values that are not updated or non-formula results, online-sheet will still calculate the prepared results based on the data actually associated with the formula.		`workbookRef.current.setCellValue(0, 2, {f: "=sum(A1:B1)", bg:"#FF0000"})`

	- Set the "C1" cell again and the new formula can still take effect.

		`worksheetRef.current.setCellValue(0, 2, {f: "=sum(A1)", bg:"#00FF00"})`
---

### clearCell

_clearCell(row, column, [options])_

Clear the contents of the cell.

| Param | Type | Description |
| ----- | ----- | ------ |
| row | number | Row index |
| column | number | Column index |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### setCellFormat

_setCellFormat(row, column, attr, value, [options])_

Sets the attributes of a cell, such as font style and background.

| Param | Type | Description |
| ----- | ----- | ------ |
| row | number | Row index |
| column | number | Column index |
| attr | string, number, object | [attribute of cell](./cell.md) |
| value | any | value of `attr` to be set |
| [options] | [CommonOptions](#commonoptions) | common options |

- **Additional instructions**

Special settings


When setting the border, attr is `"bd"`, and value is a key/value object. You need to set the border type: `borderType`/border thickness: `style`/border color: `color`, such as setting the A1 cell Borders are all/red/thin:

`luckysheet.setCellFormat(0, 0, "bd", {borderType: "border-right",style: "1", color: "#ff0000"})`

The complete optional setting parameters are as follows:

- borderType type: "border-left" | "border-right" | "border-top" | "border-bottom" | "border-all" | "border-outside" | "border-inside" | "border-horizontal" | "border-vertical" | "border-none" | "border-slash"，
- borderStyle style: 1 Thin | 2 Hair | 3 Dotted | 4 Dashed | 5 DashDot | 6 DashDotDot | ~~7 Double~~ | 8 Medium | 9 MediumDashed | 10 MediumDashDot | 11 MediumDashDotDot | ~~12 SlantedDashDot~~ | 13 Thick
- borderColor: `color: Hexadecimal color value`

---

### autoFillCell

_autoFillCell(copyRange, applyRange, direction)_

Auto fill the `applyRange` based on the data in `copyRange` like fill handle.

| Param | Type | Description |
| ----- | ----- | ------ |
| copyRange | { row: number[], column: number[] } | base range |
| applyRange | { row: number[], column: number[] } | target range |
| direction | One of "up", "down", "left", "right" | diretrion of range to be filled |

---

### freeze

_freeze(type, range, [options])_

Freezes row and column.

| Param | Type | Description |
| ----- | ----- | ------ |
| type | string | One of "row", "column" or "both" |
| range | { row: number, column: number } | `row`: row index to be freezed<br>`column`: column index to be freezed |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### insertRowOrColumn

_insertRowOrColumn(type, index, count, direction, [options])_

Inserts rows or columns at specified position.

| Param | Type | Description |
| ----- | ----- | ------ |
| type | string | One of "row", "column" |
| index | number | The starting row or column index of insertion |
| count | number | Amount of row or column to be inserted |
| direction | string | One of 'lefttop' or 'rightbottom', default to 'rightbottom'.<br>`lefttop`: insert row to the top of `index` row, or insert column to the left of `index` column.<br>`rightbottom`: insert row to the bottom of `index` row, or insert column to the right of `index` column. |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### deleteRowOrColumn

_deleteRowOrColumn(type, start, end, [options])_

Deletes rows or columns at specified range.

| Param | Type | Description |
| ----- | ----- | ------ |
| type | string | One of "row", "column" |
| start | number | The starting row or column index to be deleted |
| end | number | The ending row or column index to be deleted |
| [options] | [CommonOptions](#commonoptions) | common options |

--

### getRowHeight

_getRowHeight(rows, [options])_

Gets row heights in batch.

| Param | Type | Description |
| ----- | ----- | ------ |
| rows | number[] | A list of row indexes, e.g. [1, 4] |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** a map of specified row heights, e.g. { "1": 150, "4": 200 }

----

### getColumnWidth

_getColumnWidth(columns, [options])_

Gets column widths in batch.

| Param | Type | Description |
| ----- | ----- | ------ |
| columns | number[] | A list of column indexes, e.g. [1, 4] |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** a map of specified column widths, e.g. { "1": 150, "4": 200 }

----

### setRowHeight

_setRowHeight(rowInfo, [options])_

Sets row heights in batch.

| Param | Type | Description |
| ----- | ----- | ------ |
| rowInfo | object | A map in the form of [row index]: height.<br>Example: { "1": 150, "4": 200 } means setting height of row index 1 to 150 and height of row index 4 to 200 |
| [options] | [CommonOptions](#commonoptions) | common options |

----

### setColumnWidth

_setColumnWidth(columnInfo, [options])_

Sets column widths in batch.

| Param | Type | Description |
| ----- | ----- | ------ |
| columnInfo | object | A map in the form of [column index]: width.<br>Example: { "1": 150, "4": 200 } means setting width of column index 1 to 150 and width of column index 4 to 200 |
| [options] | [CommonOptions](#commonoptions) | common options |

----

### getSelection

_getSelection()_

Gets current selection.

**Returns** an array of current selection.

---

### setSelection

_setSelection(range, [options])_

Sets a selected range to the sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] } | A list of ranges |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### getFlattenRange

_getFlattenRange(range)_

Expands given range to cells coordinates.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] } | A range object |

Example:

Input:
```
{"row": [0, 1], "column": [0, 2]}
```

Output:
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

Maps cell coordinations to cell objects.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { r: number, c: number }[] | A list of cell coordinations |

**Returns** A list of cell objects according to specified coordinations.

---

### getSelectionCoordinates

_getSelectionCoordinates()_

Gets a list of text representation of selection coordinates.

Example output:

```json
["E10:E14", "A7:B13", "C4", "A3", "C6:D9"]
```

### getCellsByRange

_getCellsByRange(range, [options])_

Maps range to cell objects.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] }[] | A list of ranges |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** A list of cell objects according to specified coordinations.

---

### getHtmlByRange

_getHtmlByRange(range, [options])_

Gets a html representation of the specified range, typically used for pasting into other excel applications.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] }[] | A list of ranges |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** HTML string.

---

### setCellValuesByRange

_setCellValuesByRange(data, range, [options])_

Like `setCellValue`, but set multiple cell values in one shot.

| Param | Type | Description |
| ----- | ----- | ------ |
| data | any[][] | two-dimension array of cell values |
| range | { row: number[], column: number[] } | range of cells to be set |
| [options] | [CommonOptions](#commonoptions) | common options |

**Note**: size of `data` and `range` must be the same.

---

### setCellFormatByRange

_setCellFormatByRange(attr, value, range, [options])_

Like `setCellFormat`, but set multiple cell formats in one shot.

| Param | Type | Description |
| ----- | ----- | ------ |
| attr | string | attribute of cell |
| value | any | value of `attr` to be set |
| range | { row: number[], column: number[] } | range of cells to be set |
| [options] | [CommonOptions](#commonoptions) | common options |

Example:

```tsx
import { Workbook, WorkbookInstance } from "@online-sheet/react";

const ExampleComponent = () => {
  const ref = useRef < WorkbookInstance > null;

  useEffect(() => {
    // Sets A1:C3 to use the Arial font.
    ref.current?.setCellFormatByRange("ff", "Arial", {
      column: [0, 2],
      row: [0, 2],
    });
  }, []);

  return (
    <>
      <Workbook ref={ref} />
    </>
  );
};
```

---

### mergeCells

_mergeCells(ranges, type, [options])_

Merges cells according to range and type.

| Param | Type | Description |
| ----- | ----- | ------ |
| ranges | { row: number[], column: number[] }[] | list of ranges of cells to be merged |
| type | string | One of "merge-all", "merge-horizontal", "merge-vertical" |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### cancelMerge

_cancelMerge(ranges, [options])_

Cancels merge on a range.

| Param | Type | Description |
| ----- | ----- | ------ |
| ranges | { row: number[], column: number[] }[] | list of ranges of cells to be canceled |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### getAllSheets

_getAllSheets()_

**Returns** all sheets' raw data, the data will be in form of `data`.

---


### getSheet

_getSheet(options)_

Gets a sheet's raw data.

| Param | Type | Description |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** a single sheet's raw data, the data will be in form of `data`.


---

### addSheet

_addSheet()_

Adds a new sheet to the workbook.

---

### deleteSheet

_deleteSheet(options)_

Deletes the specified sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### updateSheet

_updateSheet(sheet[])_

Update sheet with specified data.

| Param | Type | Description |
| ----- | ----- | ------ |
| sheet | [Sheet](./sheet.md)[] | array of sheet info |

You can use both `celldata` and `data` to state the data of the sheets, but we recommend to use `celldata`.

---

### activateSheet

_activateSheet(options)_

Changes the current working sheet to the specified sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | common options |


---

### setSheetName

_setSheetName(name, options)_

Sets the name of the specified sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| name | string | sheet name to be set |
| [options] | [CommonOptions](#commonoptions) | common options |

---

### setSheetOrder

_setSheetOrder(orderList)_

Sets the orders of the sheets.

| Param | Type | Description |
| ----- | ----- | ------ |
| orderList | object | a map of key: sheet id, value: order number |

Example input:

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

Scroll the current sheet to specified position.

| Param | Type | Description |
| ----- | ----- | ------ |
| options | { scrollLeft?: number, scrollTop?: number, targetRow?: number, targetColumn?: number } | position to be scrolled, all four params are optional |

---

### addPresence

_addPresence(presence)_

Add a collabrator presence, the collabrator's focusing cell will be shown.

| Param | Type | Description |
| ----- | ----- | ------ |
| presence | Presence | a Presence object |

The `Presence` object:

| Field | Type | Description |
| ----- | ----- | ------ |
| sheetId | string | id of the sheet |
| username | string | username to be shown on the sheet |
| userId | string | (optional) user id to be used for comparison, if not set, uses `username` |
| color | string | color of the focusing rect |
| selection | { r: number, c: number } | position of the focusing rect |

---

### removePresence

_removePresence(presence)_

Removes a collabrator presence.

| Param | Type | Description |
| ----- | ----- | ------ |
| presence | Presence | a Presence object, see [addPresence](#addpresence), but only `username` or `userId` is required |

---

### undo

_undo()_

Undo previous action.

---

### redo

_redo()_

Undo previous action.

---

The usage example [Collabration demo](https://github.com/eoncn/online-sheet/blob/master/stories/Collabration.stories.tsx).

---

Stay tuned for more APIs.
