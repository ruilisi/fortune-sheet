
<h1 align="center">FortuneSheet</h1>
<p align="center">FortuneSheet是一款类似Excel的开箱即用的在线表格组件。</p>

[English](./README.md) | 简体中文

## 目的

`FortuneSheet`的目标是制造一个功能丰富，配置简单的在线表格组件，开箱即用。

本项目源于 [Luckysheet](https://github.com/mengshukeji/Luckysheet)，并继承了它的很多代码。我们为将其转换为typescript做了很多努力，并且解决了一些项目层面的问题。

我们的目标是让`FortuneSheet`越来越强大，同时易于维护。

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

## 开发计划
- **格式设置**：条件格式，字体
- **单元格**：拖拽，下拉填充，查找和替换，定位，数据验证
- **行和列操作**：隐藏、冻结，文本分列
- **操作体验**：撤销、格式刷，选区拖拽
- **表格操作**：筛选，排序
- **增强功能**：数据透视表，图表，评论，共享编辑，插入图片，矩阵计算，截图，复制到其他格式，EXCEL导入及导出等
- 支持Vue
- 测试


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