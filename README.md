
<h1 align="center">FortuneSheet</h1>
<p align="center">FortuneSheet is an online spreedsheet component library that provides out-of-the-box features just like Excel</p>

<div align="center">

[![Build Status](https://drone.ruilisi.com/api/badges/ruilisi/fortune-sheet/status.svg)](https://drone.ruilisi.com/ruilisi/fortune-sheet)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fruilisi%2Ffortune-sheet.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fruilisi%2Ffortune-sheet?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io/test/github/ruilisi/fortune-sheet/badge.svg)](https://snyk.io/test/github/ruilisi/fortune-sheet)
[![Build with father](https://img.shields.io/badge/build%20with-father-028fe4.svg)](https://github.com/umijs/father/)
[![lerna](https://img.shields.io/badge/maintained%20by-xiemala-cc00ff.svg)](https://xiemala.com/)

</div>


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

## Roadmap
- Support cooperative editing with backend storage.
- Support undo/redo.
- Add tests.
- More basic features:
  - fill handle
  - fonts
  - format painter
  - comments
  - insert images
  - more toolbar buttons
- Excel import and export.
- Support Vue.
- More features:
  - filter, sort
  - conditional formatting
  - drag and drop
  - find and replace
  - location
  - data verification
  - hide, freeze, and split text
- More advanced features:
  - pivot tables
  - charts
  - screenshots

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