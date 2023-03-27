# 整体配置

## 基础结构

如下是一个简洁的配置案例：

```js
// 配置项
const settings = {
    data: [{ name: 'Sheet1', celldata: [{ r: 0, c: 0, v: null }] }], // 表格数据
    onChange: (data) => {}, // onChange 事件
    lang: 'zh' // 设定表格语言
    // 更多其他设置...
}

// 渲染工作表
<Workbook {...settings} />
```

`Workbook`的配置项会作用于整个表格，单个sheet的配置则需要在`settings.data`数组中，分别设置对应更详细的参数，参考[工作表配置](./sheet.md)

针对个性化的需求，除了允许配置工具栏（[showToolbar](#showtoolbar)）、公示栏（[showFormulaBar](#showformulabar)）、底部sheet页（[showSheetTabs](#showsheettabs)）之外，
FortuneSheet开放了更细致的自定义配置选项，分别有

- 自定义工具栏（[toolbarItems](#toolbaritems)）
- 自定义单元格右键菜单（[cellContextMenu](#cellcontextmenu)）
- 自定义底部sheet页右击菜单（[sheetTabContextMenu](#sheettabcontextmenu)）

## 配置项

以下为所有支持的设置参数

- 语言 [lang](#lang)
- 工作表配置 [data](#data)
- 工作表onChange事件 [onChange](#onchange)
- 列数 [column](#column)
- 行数 [row](#row)
- 工具栏 [showToolbar](#showtoolbar)
- 自定义工具栏[toolbarItems](#toolbaritems)
- 底部sheet页 [showSheetTabs](#showsheettabs)
- 比例 [devicePixelRatio](#devicepixelratio)
- 自定义单元格右键菜单 [cellContextMenu](#cellcontextmenu)
- 自定义sheet页右击菜单 [sheetTabContextMenu](#sheettabcontextmenu)
- 行标题区域的宽度 [rowHeaderWidth](#rowheaderwidth)
- 列标题区域的高度 [columnHeaderHeight](#columnheaderheight)
- 是否显示公式栏 [showFormulaBar](#showformulabar)
- 初始化默认字体大小 [defaultFontSize](#defaultfontsize)

### lang
- 类型：String
- 默认值："zh"
- 作用：国际化设置，允许设置表格的语言，支持简体中文("zh")、英文("en")、繁体中文("zh_tw")和西班牙文("es")

------------
### data
- 类型：Array
- 默认值：undefined
- 作用：详细参数设置参见[工作表配置](./sheet.md)

------------
### onChange
- 类型: Function
- 默认值: undefined
- 当`data`改变时触发

------------
### column
- 类型：Number
- 默认值：60
- 作用：空表格默认的列数量

------------
### row
- 类型：Number
- 默认值：84
- 作用：空表格默认的行数据量

------------
### showToolbar
- 类型：Boolean
- 默认值：true
- 作用：是否显示工具栏

------------
### toolbarItems

- 类型：Array
- 默认值：[]
- 作用：自定义配置工具栏，可以与showtoolbar配合使用，`toolbarItems`拥有更高的优先级。
- 格式：
    对象格式可以很方便控制显示隐藏，使用数组形式可轻松控制按钮顺序和位置， 以下为工具栏按钮和分隔符的默认配置。
    ```json
	[
		"undo",
    "redo",
    "format-painter",
    "clear-format",
    "|",
    "currency-format",
    "percentage-format",
    "number-decrease",
    "number-increase",
    "format",
    "|",
    "font",
    "|",
    "font-size",
    "|",
    "bold",
    "italic",
    "strike-through",
    "underline",
    "|",
    "font-color",
    "background",
    "border",
    "merge-cell",
    "|",
    "horizontal-align",
    "vertical-align",
    "text-wrap",
    "text-rotation",
    "|",
    "freeze",
    "conditionFormat",
    "filter",
    "link",
    "image",
    "comment",
    "quick-formula",
    "dataVerification",
    "splitColumn",
    "locationCondition",
    "screenshot",
    "search",
	]
	```

------------
### showSheetTabs
- 类型：Boolean
- 默认值：true
- 作用：是否显示底部sheet页按钮

------------
### devicePixelRatio
- 类型：Number
- 默认值：window.devicePixelRatio
- 作用：设备比例，比例越大表格分辨率越高

------------
### cellContextMenu

- 类型：Array
- 默认值：[]
- 作用：自定义配置单元格右击菜单
- 格式：
	```json
	[
		"copy", // 复制
    "paste", // 粘贴
    "|",
    "insert-row", // 插入行
    "insert-column", // 插入列
    "delete-row", // 删除选中行
    "delete-column", // 删除选中列
    "delete-cell", // 删除单元格
    "hide-row", // 隐藏选中行和显示选中行
    "hide-column", // 隐藏选中列和显示选中列
    "set-row-height", // 设置行高
    "set-column-width", // 设置列宽
    "|",
    "clear", // 清除内容
    "sort", // 排序选区
    "orderAZ", // 升序
    "orderZA", // 降序
	]
	```

------------
### sheetTabContextMenu

- 类型：Object
- 作用：自定义配置sheet页右击菜单
- 格式：
    ```json
	[
		"delete",
		"copy",
		"rename",
		"color",
		"hide",
		"|",
		"move"
	]

------------
### rowHeaderWidth

- 类型：Number
- 默认值：46
- 作用：行标题区域的宽度，如果设置为0，则表示隐藏行标题

------------
### columnHeaderHeight

- 类型：Number
- 默认值：20
- 作用：列标题区域的高度，如果设置为0，则表示隐藏列标题

------------
### showFormulaBar

- 类型：Boolean
- 默认值：true
- 作用：是否显示公式栏

------------
### defaultFontSize
- 类型：Number
- 默认值：11
- 作用：初始化默认字体大小

------------

<!-- ## 钩子函数

钩子函数应用于二次开发时，会在各个常用鼠标或者键盘操作时植入钩子，调用开发者传入的函数，起到扩展Luckysheet功能的作用。

钩子函数统一配置在`options.hook`下，可以分别针对单元格、sheet页、表格创建配置hook。

> 使用案例可参考源码 [src/index.html](https://github.com/mengshukeji/Luckysheet/blob/master/src/index.html)

## 单元格

### cellEditBefore

- 类型：Function
- 默认值：null
- 作用：进入单元格编辑模式之前触发。在选中了某个单元格且在非编辑状态下，通常有以下三种常规方法触发进入编辑模式
	   
  - 双击单元格
  - 敲Enter键
  - 使用API：enterEditMode 

- 参数：
	- {Array} [range]: 当前选区范围

------------
### cellUpdateBefore

- 类型：Function
- 默认值：null
- 作用：更新这个单元格值之前触发，`return false` 则不执行后续的更新。在编辑状态下修改了单元格之后，退出编辑模式并进行数据更新之前触发这个钩子。
- 参数：
	- {Number} [r]: 单元格所在行数
	- {Number} [c]: 单元格所在列数
	- {Object | String | Number} [value]: 要修改的单元格内容
	- {Boolean} [isRefresh]: 是否刷新整个表格

------------
### cellUpdated

- 类型：Function
- 默认值：null
- 作用：更新这个单元格后触发
- 参数：
	- {Number} [r]: 单元格所在行数
	- {Number} [c]: 单元格所在列数
	- {Object} [oldValue]: 修改前的单元格对象
	- {Object} [newValue]: 修改后的单元格对象
	- {Boolean} [isRefresh]: 是否刷新整个表格

------------
### cellRenderBefore

- 类型：Function
- 默认值：null
- 作用：单元格渲染前触发，`return false` 则不渲染该单元格
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context

------------
### cellRenderAfter

- 类型：Function
- 默认值：null
- 作用：单元格渲染结束后触发，`return false` 则不渲染该单元格
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context

- 示例：

	一个在D1单元格的左上角和右下角分别绘制两张图的案例
	:::::: details
	```js
	luckysheet.create({
            hook: {
                cellRenderAfter: function (cell, position, sheetFile, ctx) {
                    var r = position.r;
                    var c = position.c;
                    if (r === 0 && c === 3) { // 指定处理D1单元格
                        if (!window.storeUserImage) {
                            window.storeUserImage = {}
                        }
						
                        if (!window.storeUserImage[r + '_' + c]) {
                            window.storeUserImage[r + '_' + c] = {}
                        }

                        var img = null;
                        var imgRight = null;

                        if (window.storeUserImage[r + '_' + c].image && window.storeUserImage[r + '_' + c].imgRight) {
							
							// 加载过直接取
                            img = window.storeUserImage[r + '_' + c].image;
                            imgRight = window.storeUserImage[r + '_' + c].imgRight;

                        } else {

                            img = new Image();
                            imgRight = new Image();

                            img.src = 'https://www.dogedoge.com/favicon/developer.mozilla.org.ico';
                            imgRight.src = 'https://www.dogedoge.com/static/icons/twemoji/svg/1f637.svg';

							// 图片缓存到内存，下次直接取，不用再重新加载
                            window.storeUserImage[r + '_' + c].image = img;
                            window.storeUserImage[r + '_' + c].imgRight = imgRight;

                        }

						
                        if (img.complete) { // 已经加载完成的直接渲染
                            ctx.drawImage(img, position.start_c, position.start_r, 10, 10);
                        } else {
                            img.onload = function () {
                                ctx.drawImage(img, position.start_c, position.start_r, 10, 10);
                            }

                        }

                        if (imgRight.complete) {
                            ctx.drawImage(imgRight, position.end_c - 10, position.end_r - 10, 10, 10);
                        } else {

                            imgRight.onload = function () {
                                ctx.drawImage(imgRight, position.end_c - 10, position.end_r - 10, 10, 10);
                            }
                        }

                    }
                }
            }
        })
	```
	:::

------------
### cellAllRenderBefore

- 类型：Function
- 默认值：null
- 作用：所有单元格渲染之前执行的方法。在内部，这个方法加在了`luckysheetDrawMain`渲染表格之前。
- 参数：
	- {Object} [data]: 当前工作表二维数组数据
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context

------------
### rowTitleCellRenderBefore

- 类型：Function
- 默认值：null
- 作用：行标题单元格渲染前触发，`return false` 则不渲染行标题
- 参数：
	- {String} [rowNum]:行号
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [top]:单元格左上角的垂直坐标
		+ {Number} [width]:单元格宽度
		+ {Number} [height]:单元格高度
	- {Object} [ctx]: 当前画布的context

------------
### rowTitleCellRenderAfter

- 类型：Function
- 默认值：null
- 作用：行标题单元格渲染后触发，`return false` 则不渲染行标题
- 参数：
	- {String} [rowNum]:行号
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [top]:单元格左上角的垂直坐标
		+ {Number} [width]:单元格宽度
		+ {Number} [height]:单元格高度
	- {Object} [ctx]: 当前画布的context

------------
### columnTitleCellRenderBefore

- 类型：Function
- 默认值：null
- 作用：列标题单元格渲染前触发，`return false` 则不渲染列标题
- 参数：
	- {Object} [columnAbc]:列标题字符
	- {Object} [position]:
		- {Number} [c]:单元格所在列号
		- {Number} [left]:单元格左上角的水平坐标
		- {Number} [width]:单元格宽度
		- {Number} [height]:单元格高度
	- {Object} [ctx]: 当前画布的context

------------
### columnTitleCellRenderAfter

- 类型：Function
- 默认值：null
- 作用：列标题单元格渲染后触发，`return false` 则不渲染列标题
- 参数：
	- {Object} [columnAbc]:列标题字符
	- {Object} [position]:
		- {Number} [c]:单元格所在列号
		- {Number} [left]:单元格左上角的水平坐标
		- {Number} [width]:单元格宽度
		- {Number} [height]:单元格高度
	- {Object} [ctx]: 当前画布的context

------------

## 鼠标钩子

### cellMousedownBefore

- 类型：Function
- 默认值：null
- 作用：单元格点击前的事件，`return false`则终止之后的点击操作
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context

------------
### cellMousedown

- 类型：Function
- 默认值：null
- 作用：单元格点击后的事件，`return false`则终止之后的点击操作
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context

------------
### sheetMousemove

- 类型：Function
- 默认值：null
- 作用：鼠标移动事件，可通过cell判断鼠标停留在哪个单元格
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [moveState]:鼠标移动状态，可判断现在鼠标操作的对象，false和true
		+ {Boolean} [functionResizeStatus]:工具栏拖动
		+ {Boolean} [horizontalmoveState]:水平冻结分割栏拖动
		+ {Boolean} [verticalmoveState]:垂直冻结分割栏拖动
		+ {Boolean} [pivotTableMoveState]:数据透视表字段拖动
		+ {Boolean} [sheetMoveStatus]:sheet改变你位置拖动
		+ {Boolean} [scrollStatus]:鼠标触发了滚动条移动
		+ {Boolean} [selectStatus]:鼠标移动框选数据
		+ {Boolean} [rowsSelectedStatus]:通过行标题来选择整行操作
		+ {Boolean} [colsSelectedStatus]:通过列标题来选择整列操作
		+ {Boolean} [cellSelectedMove]:选框的移动
		+ {Boolean} [cellSelectedExtend]:选框下拉填充
		+ {Boolean} [colsChangeSize]:拖拽改变列宽
		+ {Boolean} [rowsChangeSize]:拖拽改变行高
		+ {Boolean} [chartMove]:图表移动
		+ {Boolean} [chartResize]:图表改变大小
		+ {Boolean} [rangeResize]:公式参数高亮选区的大小拖拽
		+ {Boolean} [rangeMove]:公式参数高亮选区的位置拖拽
	- {Object} [ctx]: 当前画布的context

------------
### sheetMouseup

- 类型：Function
- 默认值：null
- 作用：鼠标按钮释放事件，可通过cell判断鼠标停留在哪个单元格
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [moveState]:鼠标移动状态，可判断现在鼠标操作的对象，false和true
		+ {Boolean} [functionResizeStatus]:工具栏拖动
		+ {Boolean} [horizontalmoveState]:水平冻结分割栏拖动
		+ {Boolean} [verticalmoveState]:垂直冻结分割栏拖动
		+ {Boolean} [pivotTableMoveState]:数据透视表字段拖动
		+ {Boolean} [sheetMoveStatus]:sheet改变你位置拖动
		+ {Boolean} [scrollStatus]:鼠标触发了滚动条移动
		+ {Boolean} [selectStatus]:鼠标移动框选数据
		+ {Boolean} [rowsSelectedStatus]:通过行标题来选择整行操作
		+ {Boolean} [colsSelectedStatus]:通过列标题来选择整列操作
		+ {Boolean} [cellSelectedMove]:选框的移动
		+ {Boolean} [cellSelectedExtend]:选框下拉填充
		+ {Boolean} [colsChangeSize]:拖拽改变列宽
		+ {Boolean} [rowsChangeSize]:拖拽改变行高
		+ {Boolean} [chartMove]:图表移动
		+ {Boolean} [chartResize]:图表改变大小
		+ {Boolean} [rangeResize]:公式参数高亮选区的大小拖拽
		+ {Boolean} [rangeMove]:公式参数高亮选区的位置拖拽
		+ {Boolean} [cellRightClick]:单元格右击
		+ {Boolean} [rowTitleRightClick]:行标题右击
		+ {Boolean} [columnTitleRightClick]:列标题右击
		+ {Boolean} [sheetRightClick]:底部sheet页右击
		+ {Boolean} [hyperlinkClick]:点击超链接
	- {Object} [ctx]: 当前画布的context

------------
### scroll

- 类型：Function
- 默认值：null
- 作用：鼠标滚动事件
- 参数：
	- {Object} [position]:
		+ {Number} [scrollLeft]:横向滚动条的位置
		+ {Number} [scrollTop]:垂直滚动条的位置
		+ {Number} [canvasHeight]:canvas高度
		
------------
### cellDragStop

- 类型：Function
- 默认值：null
- 作用：鼠标拖拽文件到Luckysheet内部的结束事件
- 参数：
	- {Object} [cell]:单元格对象
	- {Object} [position]:
		+ {Number} [r]:单元格所在行号
		+ {Number} [c]:单元格所在列号
		+ {Number} [start_r]:单元格左上角的垂直坐标
		+ {Number} [start_c]:单元格左上角的水平坐标
		+ {Number} [end_r]:单元格右下角的垂直坐标
		+ {Number} [end_c]:单元格右下角的水平坐标
	- {Object} [sheet]:当前sheet对象
	- {Object} [ctx]: 当前画布的context
	- {Object} [event]: 当前事件对象
		
------------

## 选区操作（包括单元格）

### rangeSelect

- 类型：Function
- 默认值：null
- 作用：框选或者设置选区后触发
- 参数：
	- {Object} [sheet]:当前sheet对象
	- {Object | Array} [range]: 选区范围，可能为多个选区

------------
### rangeMoveBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：移动选区前，包括单个单元格
- 参数：
	- {Array} [range]: 当前选区范围，只能为单个选区

------------
### rangeMoveAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：移动选区后，包括单个单元格
- 参数：
	- {Array} [oldRange]: 移动前当前选区范围，只能为单个选区
	- {Array} [newRange]: 移动后当前选区范围，只能为单个选区

------------
### rangeEditBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区修改前
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 选区范围所对应的数据

------------
### rangeEditAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区修改后
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
    - {Object} [oldData]: 修改前选区范围所对应的数据
    - {Object} [newData]: 修改后选区范围所对应的数据

------------
### rangeCopyBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区复制前
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 选区范围所对应的数据

------------
### rangeCopyAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区复制后
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 选区范围所对应的数据

------------
### rangePasteBefore

- 类型：Function
- 默认值：null
- 作用：选区粘贴前
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 要被粘贴的选区范围所对应的数据

------------
### rangePasteAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区粘贴后
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [originData]: 要被粘贴的选区范围所对应的数据
	- {Object} [pasteData]: 要粘贴的数据

------------
### rangeCutBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区剪切前
- 参数：
	- {Array} [range]: 选区范围，只能为单个范围
	- {Object} [data]: 要被剪切的选区范围所对应的数据

------------
### rangeCutAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区剪切后
- 参数：
	- {Array} [range]: 选区范围，只能为单个范围
	- {Object} [data]: 被剪切的选区范围所对应的数据

------------
### rangeDeleteBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区删除前
- 参数：
	- {Array} [range]: 选区范围，只能为单个范围
	- {Object} [data]: 要被删除的选区范围所对应的数据

------------
### rangeDeleteAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区删除后
- 参数：
	- {Array} [range]: 选区范围，只能为单个范围
	- {Object} [data]: 被删除的选区范围所对应的数据

------------
### rangeClearBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区清除前
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 要被清除的选区范围所对应的数据

------------
### rangeClearAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区清除后
- 参数：
	- {Object | Array} [range]: 选区范围，可能为多个选区
	- {Object} [data]: 被清除的选区范围所对应的数据

------------
### rangePullBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区下拉前
- 参数：
	- {Array} [range]: 当前选区范围，只能为单个范围

------------
### rangePullAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：选区下拉后
- 参数：
	- {Array} [range]: 下拉后的选区范围，只能为单个范围

------------

## 工作表

### sheetCreateBefore

- 类型：Function
- 默认值：null
- 作用：创建sheet页前触发，sheet页新建也包含数据透视表新建

------------
### sheetCreateAfter

- 类型：Function
- 默认值：null
- 作用：创建sheet页后触发，sheet页新建也包含数据透视表新建
- 参数：
	- {Object} [sheet]: 当前新创建的sheet页的配置

------------
### sheetCopyBefore

- 类型：Function
- 默认值：null
- 作用：拷贝创建sheet页前触发，sheet页新建也包含数据透视表新建
- 参数：
	- {Object} [targetSheet]: 被拷贝的sheet页配置
	- {Object} [copySheet]: 拷贝得到的sheet页的配置
------------
### sheetCopyAfter

- 类型：Function
- 默认值：null
- 作用：拷贝创建sheet页后触发，sheet页新建也包含数据透视表新建
- 参数：
	- {Object} [sheet]: 当前创建的sheet页的配置

------------
### sheetHideBefore

- 类型：Function
- 默认值：null
- 作用：隐藏sheet页前触发
- 参数：
	- {Object} [sheet]: 将要隐藏的sheet页的配置

------------
### sheetHideAfter

- 类型：Function
- 默认值：null
- 作用：隐藏sheet页后触发
- 参数：
	- {Object} [sheet]: 要隐藏的sheet页的配置

------------
### sheetShowBefore

- 类型：Function
- 默认值：null
- 作用：显示sheet页前触发
- 参数：
	- {Object} [sheet]: 将要显示的sheet页的配置

------------
### sheetShowAfter

- 类型：Function
- 默认值：null
- 作用：显示sheet页后触发
- 参数：
	- {Object} [sheet]: 要显示的sheet页的配置

------------
### sheetMoveBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet移动前
- 参数：
	- {Number} [i]: 当前sheet页的`index`
	- {Number} [order]: 当前sheet页`order`

------------
### sheetMoveAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet移动后
- 参数：
	- {Number} [i]: 当前sheet页的`index`
	- {Number} [oldOrder]: 修改前当前sheet页`order`
	- {Number} [newOrder]: 修改后当前sheet页`order`

------------
### sheetDeleteBefore

- 类型：Function
- 默认值：null
- 作用：sheet删除前
- 参数：
	- {Object} [sheet]: 要被删除sheet页的配置

------------
### sheetDeleteAfter

- 类型：Function
- 默认值：null
- 作用：sheet删除后
- 参数：
	- {Object} [sheet]: 已被删除sheet页的配置

------------
### sheetEditNameBefore

- 类型：Function
- 默认值：null
- 作用：sheet修改名称前
- 参数：
	- {Number} [i]: sheet页的`index`
	- {String} [name]: 当前sheet页名称

------------
### sheetEditNameAfter

- 类型：Function
- 默认值：null
- 作用：sheet修改名称后
- 参数：
	- {Number} [i]: sheet页的index
	- {String} [oldName]: 修改前当前sheet页名称
	- {String} [newName]: 修改后当前sheet页名称

------------
### sheetEditColorBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet修改颜色前
- 参数：
	- {Number} [i]: sheet页的`index`
	- {String} [color]: 当前sheet页颜色

------------
### sheetEditColorAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet修改颜色后
- 参数：
	- {Number} [i]: sheet页的`index`
	- {String} [oldColor]: 修改前当前sheet页颜色
	- {String} [newColor]: 修改后当前sheet页颜色

------------
### sheetZoomBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet缩放前
- 参数：
	- {Number} [i]: sheet页的`index`
	- {String} [zoom]: 当前sheet页缩放比例

------------
### sheetZoomAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：sheet缩放后
- 参数：
	- {Number} [i]: sheet页的`index`
	- {String} [oldZoom]: 修改前当前sheet页缩放比例
	- {String} [newZoom]: 修改后当前sheet页缩放比例

------------
### sheetActivate

- 类型：Function
- 默认值：null
- 作用：激活工作表前
- 参数：
	- {Number} [i]: sheet页的`index`
	- {Boolean} [isPivotInitial]: 是否切换到了数据透视表页
	- {Boolean} [isNewSheet]: 是否新建了sheet页

------------
### sheetDeactivateBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：工作表从活动状态转为非活动状态前
- 参数：
	- {Number} [i]: sheet页的`index`

------------
### sheetDeactivateAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：工作表从活动状态转为非活动状态后
- 参数：
	- {Number} [i]: sheet页的`index`
  
### imageDeleteBefore

- 类型：Function
- 默认值：null
- 作用：图片删除前触发
- 参数：
	- {Object} [imageItem]: 要删除的图片配置对象

### imageDeleteAfter

- 类型：Function
- 默认值：null
- 作用：图片删除后触发，如果自定义了图片上传，可在此处发请求删除图片
- 参数：
	- {Object} [imageItem]: 删除的图片配置对象

```js
{
	hook: {
		imageDeleteAfter: function (imageItem) {
			var src = imgItem.src;
			$.post('/rest/file/deletebyurl', {downloadUrl: src});
		}
	}
}
```

------------

## 工作簿

### workbookCreateBefore

- 类型：Function
- 默认值：null
- 作用：表格创建之前触发。旧的钩子函数叫做`beforeCreateDom`
- 参数：
	- {Object} [book]: 整个工作簿的配置（options）
    
------------
### workbookCreateAfter

- 类型：Function
- 默认值：null
- 作用：表格创建之后触发
- 参数：
	- {Object} [book]: 整个工作簿的配置（options）
     
------------
### workbookDestroyBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：表格销毁之前触发
- 参数：
	- {Object} [book]: 整个工作簿的配置（options）
    
------------
### workbookDestroyAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：表格销毁之后触发
- 参数：
	- {Object} [book]: 整个工作簿的配置（options）
    
------------
### updated

- 类型：Function
- 默认值：null
- 作用：协同编辑中的每次操作后执行的方法，监听表格内容变化，即客户端每执行一次表格操作，Luckysheet将这次操作存到历史记录中后触发，撤销重做时因为也算一次操作，也会触发此钩子函数。
- 参数：
	- {Object} [operate]: 本次操作的历史记录信息，根据不同的操作，会有不同的历史记录，参考源码 [历史记录](https://github.com/mengshukeji/Luckysheet/blob/master/src/controllers/controlHistory.js)
    
------------
### resized
（TODO）
- 类型：Function
- 默认值：null
- 作用：resize执行之后
- 参数：
	- {Object} [size]: 整个工作簿区域的宽高
    
------------
### scroll
- 类型：Function
- 默认值：null
- 作用：监听表格滚动值
- 参数：
	- {Number} [scrollLeft]: 水平方向滚动值
	- {Number} [scrollTop]: 垂直方向滚动值
	- {Number} [canvasHeight]: 滚动容器的高度
    
------------


## 协作消息

### cooperativeMessage

- 类型：Function
- 默认值：null
- 作用：接受协作消息，二次开发。拓展协作消息指令集
- 参数：
	- {Object} : 收到服务器发送的整个协作消息体对象
  
## 图片

### imageInsertBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片插入之前
- 参数：
	- {Object} [url]: 图片地址
    
------------
### imageInsertAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片插入之后
- 参数：
	- {Object} [item]]: 图片地址、宽高、位置等信息
    
------------
### imageUpdateBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片修改之前，修改的内容包括宽高、位置、裁剪等操作
- 参数：
	- {Object} [item]]: 图片地址、宽高、位置等信息
    
------------
### imageUpdateAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片修改之后，修改的内容包括宽高、位置、裁剪等操作
- 参数：
	- {Object} [oldItem]]: 修改前图片地址、宽高、位置等信息
	- {Object} [newItem]]: 修改后图片地址、宽高、位置等信息
    
------------
### imageDeleteBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片删除之前
- 参数：
	- {Object} [item]]: 图片地址、宽高、位置等信息
    
------------
### imageDeleteAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：图片删除之后
- 参数：
	- {Object} [item]]: 图片地址、宽高、位置等信息
    
------------

## 批注

### commentInsertBefore

- 类型：Function
- 默认值：null
- 作用：插入批注之前，`return false` 则不插入批注
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号

------------
### commentInsertAfter

- 类型：Function
- 默认值：null
- 作用：插入批注之后
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号
	- {Object} [cell]: 被插入批注所在的单元格信息，如：`{ r:0,c:2,v:{m:'233',v:'233'}}`，包含批注信息
    
------------
### commentDeleteBefore

- 类型：Function
- 默认值：null
- 作用：删除批注之前，`return false` 则不删除批注
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号
	- {Object} [cell]: 要删除的批注所在的单元格信息，如：`{ r:0,c:2,v:{m:'233',v:'233'}}`，可以看到批注信息

------------
### commentDeleteAfter

- 类型：Function
- 默认值：null
- 作用：删除批注之后
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号
	- {Object} [cell]: 被删除批注所在的单元格信息，如：`{ r:0,c:2,v:{m:'233',v:'233'}}`，可以看到批注已被删除
    
------------
### commentUpdateBefore

- 类型：Function
- 默认值：null
- 作用：修改批注之前，`return false` 则不修改批注
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号
	- {String} [value]: 新的批注内容

------------
### commentUpdateAfter

- 类型：Function
- 默认值：null
- 作用：修改批注之后
- 参数：
	- {Number} [r]:单元格所在行号
	- {Number} [c]:单元格所在列号
	- {Object} [oldCell]: 修改前批注所在的单元格信息，如：`{ r:0,c:2,v:{m:'233',v:'233'}}`
	- {Object} [newCell]: 修改后批注所在的单元格信息，如：`{ r:0,c:2,v:{m:'233',v:'233'}}`
    
------------

## 数据透视表

### pivotTableEditBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：修改数据透视表之前，操作如：拖动字段等
- 参数：
	- {Object} [sheet]: 数据透视表所在sheet页配置

------------
### pivotTableEditAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：修改数据透视表之后，操作如：拖动字段等
- 参数：
	- {Object} [oldSheet]: 修改前数据透视表所在sheet页配置
	- {Object} [newSheet]: 修改后数据透视表所在sheet页配置
    
------------

## 冻结

### frozenCreateBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：设置冻结前
- 参数：
	- {Object} [frozen]: 冻结类型信息

------------
### frozenCreateAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：设置冻结后
- 参数：
	- {Object} [frozen]: 冻结类型信息
    
------------
### frozenCancelBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：取消冻结前
- 参数：
	- {Object} [frozen]: 冻结类型信息

------------
### frozenCancelAfter
（TODO）
- 类型：Function
- 默认值：null
- 作用：取消冻结后
- 参数：
	- {Object} [frozen]: 冻结类型信息
    
------------

## 打印

### printBefore
（TODO）
- 类型：Function
- 默认值：null
- 作用：打印前

------------

## 旧版钩子函数

### fireMousedown

- 类型：Function
- 默认值：null
- 作用：单元格数据下钻自定义方法，注意此钩子函数是挂载在options下：`options.fireMousedown`

------------

## 分页器

### onTogglePager

- 类型：Function
- 默认值：null
- 作用：点击分页按钮回调函数，返回当前页码，具体参数参照[sPage backFun](https://github.com/jvbei/sPage)
- 参数：
	- {Object} [page]: 返回当前分页对象

------------ -->