
<p align="center">
  <img align="center" src="logo.png" width="150px" height="150px" />
</p>
<h1 align="center">FortuneSheet</h1>
<p align="center">FortuneSheet是一款类似Excel的开箱即用的在线表格组件。</p>

<div align="center">

[![Build Status](https://drone.ruilisi.com/api/badges/ruilisi/fortune-sheet/status.svg)](https://drone.ruilisi.com/ruilisi/fortune-sheet)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fruilisi%2Ffortune-sheet.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fruilisi%2Ffortune-sheet?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io/test/github/ruilisi/fortune-sheet/badge.svg)](https://snyk.io/test/github/ruilisi/fortune-sheet)
[![Build with father](https://img.shields.io/badge/build%20with-father-028fe4.svg)](https://github.com/umijs/father/)
[![xiemala](https://img.shields.io/badge/maintained%20by-xiemala-cc00ff.svg)](https://xiemala.com/)

</div>

[English](./README.md) | 简体中文

## 目的

`FortuneSheet`的目标是制造一个功能丰富，配置简单的在线表格组件，开箱即用。

本项目源于 [Luckysheet](https://github.com/mengshukeji/Luckysheet)，并继承了它的很多代码。我们为将其转换为typescript做了很多努力，并且解决了一些项目层面的问题。

我们的目标是让`FortuneSheet`越来越强大，同时易于维护。

## 在线样例

项目的在线Demo：[fortune-sheet-demo](https://ruilisi.github.io/fortune-sheet-demo/)

## 注意
本项目处于早期开发阶段，API可能在将来发生巨大变化，请谨慎在生产环境使用。

## 对Luckysheet的改进

- 完全使用typescript编写。
- 可以用 `import` / `require` 导入本库了。
  ```js
  import { Workbook } from '@fortune-sheet/react'
  ```
- 同页面支持多个实例。
- 去掉了 `jQuery` 的依赖, 用原生 `React` / `Vue` + `immer` 来管理Dom和状态。
- 用一个forked [handsontable/formula-parser](https://github.com/handsontable/formula-parser) 来处理公式计算。
- 优化dom结构。
- 用SVG代替`iconfont`的图标，因为`iconfont`的图标对其他开发者而言很不方便改动。
- 容器外面不创建可见的页面元素。
- 避免在`window`对象上存储数据。

## 特性

- 数据结构兼容Luckysheet。
- **格式设置**：样式，文本对齐及旋转，文本截断、溢出、自动换行，多种数据类型，单元格内多样式
- **单元格**：多选区，合并单元格
- **行和列操作**：插入、删除行或列
- **操作体验**：复制、粘贴、剪切，快捷键
- **公式和函数**：内置公式

## 开发路线
- ✅ 支持协同编辑和后端存储.
- ✅ 支持撤销/重做.
- 手机端适配.
- 开放API.
- 增加测试代码.
- 更多基础功能:
  - 下拉填充
  - 字体
  - ✅ 格式刷
  - ✅ 评论
  - 插入图片
  - 更多工具栏按钮
- Excel 导入和导出.
- 支持Vue.
- 更多功能:
  - 筛选，排序
  - 条件格式
  - 拖拽
  - 查找和替换
  - 定位
  - 数据验证
  - 隐藏、冻结，文本分列
- 更多高级功能:
  - 数据透视表
  - 图表
  - 截图


## 文档

请参考详细文档 [fortune-sheet-doc](https://ruilisi.github.io/fortune-sheet-docs/)

## 快速开始 (react)

### 安装库
```shell
yarn add @fortune-sheet/react
```
或使用 npm:
```shell
npm install @fortune-sheet/react
```

### 创建一个HTML容器
```html
<style>
  html, body, #root {
    width: 100%;
    height: 100%;
  }
</style>
<div id="root"></div>
```

**注意**: `width` 和 `height` 不是一定要设为 100%, 但要有值. 如果设为 `auto`, 表格区域有可能不显示.

### 渲染表格

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

### 后端存储和在线协同

每当用户在表格上做操作，一个`Op`列表会通过`onOp`回调发出。op描述了如何从当前数据修改为用户操作后的新数据的步骤。例如，当用户在A2单元格上设置了加粗，生成的op如下：

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

op对后端数据修改和同步在线协同数据非常有用。

我们在 `backend-demo` 目录中展示了一个例子，使用 `Express` (后端) and `MongoDB` (数据库) 实现。

通过 `node index.js` 运行后端服务器，然后访问 [Collabration example](https://ruilisi.github.io/fortune-sheet-demo/?path=/story/collabration--example) 即可体验。

详细的 `Op` 文档, 请参考 [fortune-sheet-doc](https://ruilisi.github.io/fortune-sheet-docs/zh/guide/op.html)

## 贡献
期望的工作流程为: Fork -> Patch -> Push -> Pull Request

请确保仔细阅读 [贡献指南](https://ruilisi.github.io/fortune-sheet-docs/zh/guide/contribute.html)。


## 开发
### 安装
```shell
yarn
```

### 开发
```shell
yarn dev
```

### 打包
```shell
yarn build
```

## 许可
本项目使用MIT许可. 在 [MIT](http://opensource.org/licenses/MIT) 查看完整文本。