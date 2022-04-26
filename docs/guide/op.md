# Operation

Each time a user operates on the sheet, an array of `Op` will be emiited through `onOp` callback. An op describes how to modify the current data to reach the new data after the user's operation. For example, here is an op when user sets the cell font to be bold on cell A2.

```json
[
    {
        "op": "replace",
        "index": "0",
        "path": ["data", 1, 0, "bl"],
        "value": 1
    }
]
```

The op is useful for database modification and syncing state in online collabration.

A working example with `Express` (backend server) and `MongoDB` (data persistence) is avaiable in `backend-demo` folder.

Run it with `node index.js` and visit [Collabration example](https://ruilisi.github.io/fortune-sheet-demo/?path=/story/collabration--example)

> You can initialize data by visiting http://localhost:8081/init

## Format

Each `Op` has the following structure.

```ts
{
    "op": string,
    "index": string,
    "path": any[],
    "value": any
}
```

where

| Field | Description |
| ----- | ----------- |
| op | Operation name, should be one of `add`, `remove`, `replce`, `insertRowCol`, `deleteRowCol`, `addSheet`, `deleteSheet` |
| index | Sheet index of the operation |
| path | Path of the value to be updated |
| value | Value to be updated |


## Operation name

| Name | Description |
| ----- | ----------- |
| add | Add the value to path |
| replace | Replace the value at path |
| remove | Remove the value at path |
| insertRowCol | Special op, see [insertRowCol](#insertrowcol) |
| deleteRowCol | Special op, see [deleteRowCol](#deleterowcol) |
| addSheet | Special op, see [addSheet](#addsheet) |
| deleteSheet | Special op, see [deleteSheet](#deletesheet) |


## Special ops

Special ops are ops that are hard to be described by `add`, `replace` or `remove`, because the op data size will be too large.

### insertRowCol

Indicates that user performed row or column insertion.

`value` will be in the format:

```ts
{
  type: "row" | "column";
  index: number;
  count: number;
  direction: "lefttop" | "rightbottom";
  sheetIndex: string;
}
```

where

| Field | Description |
| ----- | ----------- |
| type | `row` or `column` |
| index | Start index of row or column to be inserted |
| count | Amount of the rows or columns to insert |
| direction | Insert direction, `lefttop` or `rightbottom` |
| sheetIndex | index of the operated sheet |

### deleteRowCol

Indicates that user performed row or column deletion.

`value` will be in the format:

```ts
{
  type: "row" | "column";
  start: number;
  end: number;
  sheetIndex: string;
}
```

where

| Field | Description |
| ----- | ----------- |
| type | `row` or `column` |
| start | Start index of row or column to be deleted |
| end | End index of row or column to be deleted |
| sheetIndex | index of the operated sheet |

### addSheet

Indicates that user created a new sheet.

`value` will be the new sheet data.

### deleteSheet

Indicates that user deleted a sheet.

`value` will be in the format

```ts
{
  index: string;
}
```

where

| Field | Description |
| ----- | ----------- |
| index | index of the sheet to be deleted |