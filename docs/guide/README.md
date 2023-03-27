# Get started

## Introduction
FortuneSheet is a drop-in javascript spreadsheet library that provides rich features like Excel and Google Sheets.

This project is originated from [Luckysheet](https://github.com/mengshukeji/Luckysheet) and has inherited many code from it. Lots of efforts have done to translate the whole project to typescript (still in progress), and solved problems in project level.

## Demo
[Online demo](https://ruilisi.github.io/fortune-sheet-demo/)

## Features
(~~Cross line~~ means planned but not yet implemented)

### ️Formatting
+ **Styling** (~~Change font style~~, size, color, or apply effects)
+ **Conditional formatting** (highlight interesting cells or ranges of cells, emphasize unusual values, and visualize data by using data bars, color scales, and icon sets that correspond to specific variations in the data)
+ **Align or rotate text** 
+ **Support text truncation, overflow, automatic line wrapping**
+ **Data types** 
	+ **currency, percentages, decimals, dates** 
	+ **Custom** (E.g `##,###0.00` , `$1,234.56$##,###0.00_);[Red]($##,###0.00)`, `_($* ##,###0.00_);_(...($* "-"_);_(@_)`, `08-05 PM 01:30MM-dd AM/PM hh:mm` )
+ **Cell segmentation style** (Alt+Enter line break, sub,super, in-cell style)

### Cells
+ **Move cells by drag and dropping** (Operate on selection)
+ **Fill handle** (For a series like 1, 2, 3, 4, 5..., type 1 and 2 in the first two cells. For the series 2, 4, 6, 8..., type 2 and 4. Support arithmetic sequence, geometric sequence,date, week,chinese numbers)
+ ~~**Auto Fill Options**~~ (Fill copy, sequence, only format, no format, day, month, year)
+ **Multiple selection** (Hold Ctrl Selecting multiple cells, copy and paste)
+ **Find and replace** (Such as a particular number or text string, Support regular expression, whole word, case sensitive)
+ ~~**Location**~~ (Cells can be selected according to the data type)
+ **Merge cells**
+ **Data validation**  (Checkbox, drop-down list, datePicker)

### ️Row & columns
+ **Hide, Insert, Delete rows and columns** 
+ **Frozen rows and columns** (First row, first column, Frozen to selection, freeze adjustment lever can be dragged)
+ **Split text** (Split text into different columns with the Convert Text to Columns Wizard)

### Operation
+ **Undo/Redo**
+ **Copy/Paste/Cut** (Copy from excel to Luckysheet with format, vice versa)
+ **Hot key** (The operating experience is consistent with excel, if there are differences or missing, please feedback to us)
+ **Format Painter** (Similar to google sheet)
+ ~~**Selection by drag and dropping**~~ (Change the parameters of formula and chart through selection)

### ️Formulas & functions
+ **Built-in formulas**
	+ Math (SUMIFS, AVERAGEIFS, SUMIF, SUM, etc.)
	+ Text (CONCATENATE, REGEXMATCH, MID)
	+ Date (DATEVALUE, DATEDIF, NOW, WEEKDAY, etc.)
	+ Financial (PV, FV, IRR, NPV, etc.)
	+ Logical (IF, AND, OR, IFERROR, etc.)
	+ Lookup (VLOOKUP, HLOOkUP, INDIRECT, OFFSET, etc.)
	+ Dynamic Array (Excel2019 new formulas, SORT,FILTER,UNIQUE,RANDARRAY,SEQUENCE)
+ **Array** (={1,2,3,4,5,6}, Crtl+Shift+Enter)
+ ~~**Custom**~~  (Some formula suitable for use in China have been added. AGE_BY_IDCARD, SEX_BY_IDCARD, BIRTHDAY_BY_IDCARD, PROVINCE_BY_IDCARD, CITY_BY_IDCARD, etc. You can define any formula you want)

### Tables
+ **Filters** (Support color , numerical, date, text filtering)
+ **Sort** (Sort multiple fields simultaneously)

### ~~Pivot table~~
+ **Arrange fields** (Add fileds to rows, columns, values, area, it is similar to excel)
+ **Aggregation**  (Surport Sum,Count,CountA,CountUnique,Average,Max,Min,Median,Product,Stdev,Stdevp,Var,VarP etc.)
+ **Filter data** (Add fileds to filters area and analyze the desired data )
+ **Drill down** (Double click pivot table cell to drill down for detail data )
+ **Create a PivotChart** (Pivot table can create a chart )

### ~~Chart~~
+ **Support types** (Line, Column, Area, Bar, Pie, comming soon Scatter, Radar, Gauge, Funnel etc.) 
+ **Chart Plugins**  (Link to another project [ChartMix](https://github.com/mengshukeji/chartMix)(MIT): ECharts is currently supported,Highcharts, Ali G2, amCharts, googleChart, chart.js are being developed gradually)
+ **Sparklines** (Support by formula : Line, Pie, Box, Pie etc.)

### ️~~Share~~
+ **Comments** (Add, delete, update)
+ **Collaborate** (Simultaneous editing by multiple users)

### Insert object
+ **Insert picture** (JPG,PNG,SVG and so on)

### Misc
+ **Screenshot** (Take a screenshot with selection)
+ **~~EXCEL import/export~~** (Specially adapted to Luckysheet, export is under development)

## Quick start (react)

### Download and install the library
```shell
yarn add @fortune-sheet/react
```
or using npm:
```shell
npm install @fortune-sheet/react
```

### Create an HTML placeholder
```html
<style>
  html, body, #root {
    width: 100%;
    height: 100%;
  }
</style>
<div id="root"></div>
```

**NOTE**: `width` and `height` doesn't have to be 100%, but should at least have a value. If set to `auto`, table area may not show.

### Render the sheet

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css"

ReactDOM.render(
  <Workbook data={[{ name: "Sheet1" }]} />,
  document.getElementById('root')
);
```

## Development
### Installation
```shell
yarn
```

### Development
```shell
yarn dev
```

### Packaging
```shell
yarn build
```

## Configuration

Please refer to [Overall configuration](./config.md) for detailed information.

## Keyboard shortcuts
(~~Cross line~~ means not yet implemented)

| Keyboard shortcuts | Features |
| ------------ | ------------ |
|  CTRL + C | Copy cell |
|  CTRL + V | Paste cell |
|  CTRL + X | Cut cell |
|  CTRL + Z | Undo |
|  CTRL + Y | Redo |
|  CTRL + A | Select all |
|  CTRL + B | Bold |
|  CTRL + F | Find |
|  CTRL + H | Replace |
|  CTRL + I | Italic |
|  ~~CTRL + UP/DOWN/LEFT/RIGHT~~ | Quickly adjust cell marquee |
|  ~~SHIFT + UP/DOWN/LEFT/RIGHT~~ | Adjust selection area |
|  CTRL + Left mouse click | Multiple selection cell |
|  ~~SHIFT + Left mouse click~~ | Adjust selection area |
|  UP/DOWN/LEFT/RIGHT | Move cell selection box |
|  ENTER | Edit cell |
|  TAB | Move cell selection box to the right |
|  DELETE | Clear cell data |
