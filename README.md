
<h1 align="center">FortuneSheet</h1>
<p align="center">FortuneSheet is an online spreedsheet component library that provides out-of-the-box features just like Excel</p>

English | [简体中文](./README-zh.md)

## Purpose

The goal of `FortuneSheet` is to make a feature-rich, easy-to-configure online spreedsheet that you can use out-of-the-box.

This project is originated from [Luckysheet](https://github.com/mengshukeji/Luckysheet) and has inherited many code from it. Lots of efforts have done to translate the whole project to typescript (still in progress), and solved problems in project level.

We aim to make FortuneSheet powerful yet easy to maintain.

Take a look at the online demo at [fortune-sheet-demo](https://ruilisi.github.io/fortune-sheet-demo/)

## Attention
This project is in the state of early development, APIs may have significant change in the future, use with caution in production.

## Improvements to Luckysheet

- Written fully in typescript.
- You can now use `import` / `require` to use the library.
  ```js
  import { Workbook } from '@fortune-sheet/react'
  ```
- Multiple instance on the same page is supported.
- Dropped `jQuery` dependency, uses native `React` / `Vue` + `immer` to manage the dom and state.
- Changed to a forked [handsontable/formula-parser](https://github.com/handsontable/formula-parser) to handle formula calculations.
- Optimized the dom structure.
- Replaced icons from `iconfont` with SVGs, as `iconfont` icons are inconvenient to update for other maintainers.
- No visible elements is created outside container.
- Never stores data in the `window` object.

## Features

- Data structure is compatible with Luckysheet.
- **Formatting**: style, text alignment and rotation, text truncation, overflow, automatic line wrapping, multiple data types, cell segmentation style
- **Cells**: multiple selection, merge cells
- **Row & column**: insert, delete rows or columns
- **Operation**: copy, paste, cut, hot key
- **Formulas & Functions**: Built-in formulas

## TODOs
- **Formatting**: conditional formatting, fonts
- **Cells**: drag and drop, fill handle, find and replace, location, data verification
- **Row & column**: hide, freeze, and split text
- **Operation**: undo, redo, format painter, drag and drop selection
- **Tables**: filter, sort
- **Enhanced functions**: Pivot tables, charts, comments, cooperative editing, insert picture, matrix calculations, screenshots, copying to other formats, EXCEL import and export, etc.
- Vue support.
- Tests.


## Documentation

See detailed documentation at [fortune-sheet-doc](https://ruilisi.github.io/fortune-sheet-docs/)

## Get started (react)

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
## Contributing
Expected workflow is: Fork -> Patch -> Push -> Pull Request

Please make sure to read the [Contributing Guide](https://ruilisi.github.io/fortune-sheet-docs/guide/contribute.html) before making a pull request.


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

## License
This project is licensed under the MIT License. See [MIT](http://opensource.org/licenses/MIT) for the full license text.