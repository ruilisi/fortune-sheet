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
| [freeze](#freeze) | Freezes row and column |
| [insertRowOrColumn](#insertroworcolumn) | Inserts rows or columns at specified position |
| [deleteRowOrColumn](#deleteroworcolumn) | Deletes rows or columns at specified range |
| [getRowHeight](#getrowheight) | Gets row heights in batch |
| [getColumnWidth](#getcolumnwidth) | Gets column widths in batch |
| [setRowHeight](#setrowheight) | Sets row heights in batch |
| [setColumnWidth](#setcolumnwidth) | Sets column widths in batch |
| [getSelection](#getselection) | Gets current selection |
| [getFlattenRange](#getflattenrange) | Expands given range to cells coordinates |
| [getCellsByFlattenRange](#getcellsbyflattenrange) | Maps cell coordinations to cell objects |
| [getSelectionCoordinates](#getselectioncoordinates) | Gets a list of text representation of selection coordinates |
| [getCellsByRange](#getcellsbyrange) | Maps range to cell objects |
| [getHtmlByRange](#gethtmlbyrange) | Gets a html representation of the specified range |
| [setSelection](#setselection) | Sets a selected range to the sheet |
| [setCellValuesByRange](#setcellvaluesbyrange) | Like `setCellValue`, but set multiple cell values in one shot |
| [setCellFormatByRange](#setcellformatbyrange) | Like `setCellFormat`, but set multiple cell formats in one shot |
| [mergeCells](#mergecells) | Merges cells according to range and type |
| [cancelMerge](#cancelmerge) | Cancels merge on a range |
| [getAllSheets](#getallsheets) | Gets all sheets' raw data |
| [getSheet](#getsheet) | Gets a sheet's raw data |
| [addSheet](#addsheet) | Adds a new sheet to the workbook |
| [deleteSheet](#deletesheet) | Deletes the specified sheet |
| [activateSheet](#activatesheet) | Changes the current working sheet to the specified sheet |
| [setSheetName](#setsheetname) | Sets the name of the specified sheet |
| [setSheetOrder](#setsheetorder) | Sets the orders of the sheets |
| [scroll](#scroll) | Scroll the current sheet to specified position |
| [addPresence](#addpresence) | Add a collabrator presence |
| [removePresence](#removepresence) | Removes a collabrator presence |

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

See [Collabration demo](https://github.com/ruilisi/fortune-sheet/blob/master/stories/Collabration.stories.tsx) for an example usage.

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
| attr | string | attribute of cell |
| value | any | value of `attr` to be set |
| [options] | [CommonOptions](#commonoptions) | common options |

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

### setSelection

_setSelection(range, [options])_

Sets a selected range to the sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| range | { row: number[], column: number[] } | A list of ranges |
| [options] | [CommonOptions](#commonoptions) | common options |


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

**Returns** all sheets' raw data.

---


### getSheet

_getSheet(options)_

Gets a sheet's raw data.

| Param | Type | Description |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | common options |

**Returns** a single sheet's raw data.


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

### activateSheet

_activateSheet(options)_

Changes the current working sheet to the specified sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
| [options] | [CommonOptions](#commonoptions) | common options |


---

### setSheetName

_setSheetName(options)_

Sets the name of the specified sheet.

| Param | Type | Description |
| ----- | ----- | ------ |
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

**Note**: This api will reorder all sheets starting from 0. So, you can just specify the sheet you want to **move**, by setting a **middle** order number. For example, assume current sheet order is:

```json
{
	"id_of_sheet_1": 0,
	"id_of_sheet_2": 1,
	"id_of_sheet_3": 2,
}
```

You want `id_of_sheet_3` to be moved between `id_of_sheet_1` and `id_of_sheet_2`, then call this API with:

```json
{
	"id_of_sheet_3": 0.5
}
```

And the resulting order number will be:

```json
{
	"id_of_sheet_1": 0,
	"id_of_sheet_3": 1,
	"id_of_sheet_2": 2,
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
