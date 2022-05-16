# Overall configuration

## Basic Structure

Below is a simple configuration example:

```js
// Configuration item
const settings = {
     data: [{ name: 'Sheet1', celldata: [{ r: 0, c: 0, v: null }] }], // sheet data
     onChange: (data) => {}, // onChange event
     lang:'zh' // set language
     // More other settings...
}

// Render the workbook
<Workbook {...settings} />
```

`Workbook` props will affect the entire workbook. The configuration of a single worksheet needs to be set in the `settings.data` array to set more detailed parameters. Refer to [Worksheet Configuration](/guide/sheet.html)

For personalized needs, in addition to allowing configuration information bar toolbar ([showToolbar](#showtoolbar)), formula bar ([showFormulaBar](#showformulabar)) and bottom sheet bar ([showSheetTabs](#showsheettabs)),
FortuneSheet has opened more detailed custom configuration options, which are as follows:

- Customize the toolbar ([toolbarItems](#toolbaritems))
- Custom cell context menu ([cellContextMenu](#cellcontextmenu))
- Customize the context menu of the bottom sheet bar ([sheetTabContextMenu](#sheettabcontextmenu))

## Configuration item

The following are all supported setting parameters

- Language [lang](#lang)
- Worksheet configuration [data](#data)
- Worksheet onChange event [onChange](#onchange)
- Number of columns [column](#column)
- Number of rows [row](#row)
- Toolbar [showToolbar](#showtoolbar)
- Customize Toolbar [toolbarItems](#toolbaritems)
- Bottom sheet bar [showSheetTabs](#showsheettabs)
- Ratio [devicePixelRatio](#devicepixelratio)
- Custom cell right-click menu [cellContextMenu](#cellcontextmenu)
- Customize the right-click menu of the bottom sheet bar [sheetTabContextMenu](#sheettabcontextmenu)
- The width of the row header area [rowHeaderWidth](#rowheaderwidth)
- The height of the column header area [columnHeaderHeight](#columnheaderheight)
- Whether to show the formula bar [showFormulaBar](#showformulabar)
- Initialize the default font size [defaultFontSize](#defaultfontsize)

### lang
- Type: String
- Default: "zh"
- Usage: Internationalization settings, allow to set the language of the table, support simplified Chinese ("zh"), English ("en") and traditional Chinese ("zh_tw") and Spanish ("es")

------------
### data
- Type: Array
- Default: undefined
- For detailed parameter settings, please refer to [worksheet configuration](/guide/sheet.html)

------------
### onChange
- Type: Function
- Default: undefined
- Emitted when workbook `data` has changed

------------
### column
- Type: Number
- Default: 60
- Usage: The default number of columns in an empty workbook

------------
### row
- Type: Number
- Default: 84
- Usage: The default number of rows in an empty workbook

------------
### showToolbar
- Type: Boolean
- Default: true
- Usage: Whether to show the toolbar

------------
### toolbarItems

- Type: Array
- Usage: Custom configuration toolbar,can be used in conjunction with `showToolbar`, `toolbarItems` has a higher priority.
- Format:

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
		"sort",
		"image",
		"comment",
		"quick-formula",
	]
```

------------
### showSheetTabs
- Type: Boolean
- Default: true
- Usage: Whether to show the bottom sheet button

------------
### devicePixelRatio
- Type: Number
- Default: window.devicePixelRatio
- Usage: Device ratio, the larger the ratio, the higher the resolution of the workbook

------------
### cellContextMenu

- Type: Array
- Default: []
- Usage: Custom configuration cell right-click menu
- Format: 	
	```json
	[
		"copy", // 复制
		"paste", // 粘贴
		"insert-row", // 插入行
		"insert-column", // 插入列
		"delete-row", // 删除选中行
		"delete-column", // 删除选中列
		"delete-cell", // 删除单元格
		"hide-row", // 隐藏选中行和显示选中行
		"hide-column", // 隐藏选中列和显示选中列
		"clear", // 清除内容
		"sort", // 排序选区
		"filter", // 筛选选区
		"chart", // 图表生成
		"image", // 插入图片
		"link", // 插入链接
		"data", // 数据验证
		"cell-format" // 设置单元格格式
	]
	```
	
------------
### sheetTabContextMenu

- Type: Object
- Usage: Customize the right-click menu of the bottom sheet bar
- Format: 
    ```json
	[
		"delete",
		"copy",
		"rename",
		"color",
		"hide",
		"move"
	]

------------
### rowHeaderWidth
- Type: Number
- Default: 46
- Usage: The width of the row header area, if set to 0, it means to hide the row header

------------
### columnHeaderHeight
- Type: Number
- Default: 20
- Usage: The height of the column header area, if set to 0, it means hide the column header

------------
### showFormulaBar
- Type: Boolean
- Default: true
- Usage: Whether to show the formula bar

------------
### defaultFontSize
- Type：Number
- Default：11
- Usage：Initialize the default font size

------------


<!-- ## Hook Function (TODO)

When the hook function is used in secondary development, hooks will be implanted in each common mouse or keyboard operation, and the function passed in by the developer will be called to expand the function of Luckysheet.

The hook functions are uniformly configured under ʻoptions.hook`, and configuration hooks can be created separately for cells, sheet pages, and tables.

## Cell

### cellEditBefore

- Type: Function
- Default: null
- Usage: Triggered before entering the cell editing mode. When a cell is selected and in the non-editing state, there are usually the following three conventional methods to trigger the edit mode
   - Double click the cell
   - Hit Enter
   - Use API: enterEditMode
- Parameter: 
	- {Array} [range]: Current selection range

------------
### cellUpdateBefore

- Type: Function
- Default: null
- Usage: Triggered before updating this cell value, `return false` will not perform subsequent updates. After modifying the cell in the editing state, this hook is triggered before exiting the editing mode and updating the data.
- Parameter: 
	- {Number} [r]: The row number of the cell
	- {Number} [c]: The column number of the cell
	- {Object | String | Number} [value]: The content of the cell to be modified
	- {Boolean} [isRefresh]: Whether to refresh the entire table

------------
### cellUpdated

- Type: Function
- Default: null
- Usage: Triggered after updating this cell
- Parameter: 
	- {Number} [r]: The row number of the cell
	- {Number} [c]: The column number of the cell
	- {Object} [oldValue]: Cell object before modification
	- {Object} [newValue]: Modified cell object
	- {Boolean} [isRefresh]: Whether to refresh the entire table

------------
### cellRenderBefore

- Type: Function
- Default: null
- Usage: Triggered before the cell is rendered, `return false` will not render the cell
- Parameter: 
	- {Object} [cell]:Cell object
	- {Object} [position]:
		+ {Number} [r]: The row number of the cell
		+ {Number} [c]: The column number of the cell
		+ {Number} [start_r]: The horizontal coordinate of the upper left corner of the cell
		+ {Number} [start_c]: The vertical coordinate of the upper left corner of the cell
		+ {Number} [end_r]: The horizontal coordinate of the lower right corner of the cell
		+ {Number} [end_c]: The vertical coordinate of the lower right corner of the cell
	- {Object} [sheet]: Current sheet object
	- {Object} [ctx]: The context of the current canvas

------------
### cellRenderAfter

- Type: Function
- Default: null
- Usage: Triggered after the cell rendering ends, `return false` will not render the cell
- Parameter: 
	- {Object} [cell]: Cell object
	- {Object} [position]:
		+ {Number} [r]: The row number of the cell
		+ {Number} [c]: The column number of the cell
		+ {Number} [start_r]: The horizontal coordinate of the upper left corner of the cell
		+ {Number} [start_c]: The vertical coordinate of the upper left corner of the cell
		+ {Number} [end_r]: The horizontal coordinate of the lower right corner of the cell
		+ {Number} [end_c]: The vertical coordinate of the lower right corner of the cell
	- {Object} [sheet]: Current worksheet object
	- {Object} [ctx]: The context of the current canvas

- Example:

	A case of drawing two pictures in the upper left corner and lower right corner of cell D1
	:::::: details
	```js
	luckysheet.create({
            hook: {
                cellRenderAfter: function (cell, position, sheetFile, ctx) {
                    var r = position.r;
                    var c = position.c;
                    if (r === 0 && c === 3) { // Specify to process cell D1
                        if (!window.storeUserImage) {
                            window.storeUserImage = {}
                        }
						
                        if (!window.storeUserImage[r + '_' + c]) {
                            window.storeUserImage[r + '_' + c] = {}
                        }

                        var img = null;
                        var imgRight = null;

                        if (window.storeUserImage[r + '_' + c].image && window.storeUserImage[r + '_' + c].imgRight) {
							
							// Fetch directly after loading
                            img = window.storeUserImage[r + '_' + c].image;
                            imgRight = window.storeUserImage[r + '_' + c].imgRight;

                        } else {

                            img = new Image();
                            imgRight = new Image();

                            img.src = 'https://www.dogedoge.com/favicon/developer.mozilla.org.ico';
                            imgRight.src = 'https://www.dogedoge.com/static/icons/twemoji/svg/1f637.svg';

							// The picture is cached in the memory, fetched directly next time, no need to reload
                            window.storeUserImage[r + '_' + c].image = img;
                            window.storeUserImage[r + '_' + c].imgRight = imgRight;

                        }

						
                        if (img.complete) { //Direct rendering that has been loaded
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

- Type: Function
- Default: null
- Usage:The method executed before all cells are rendered. Internally, this method is added before `luckysheetDrawMain` renders the table.
- Parameter: 
	- {Object} [data]: Two-dimensional array data of the current worksheet
	- {Object} [sheet]: Current worksheet object
	- {Object} [ctx]: The context of the current canvas

------------
### rowTitleCellRenderBefore

- Type: Function
- Default: null
- Usage: Triggered before the row header cell is rendered, `return false` will not render the row header
- Parameter: 
	- {String} [rowNum]: Row number
	- {Object} [position]:
		+ {Number} [r]: The row number of the cell
		+ {Number} [top]: The vertical coordinate of the upper left corner of the cell
		+ {Number} [width]: Cell width
		+ {Number} [height]: Cell height
	- {Object} [ctx]: The context of the current canvas

------------
### rowTitleCellRenderAfter

- Type: Function
- Default: null
- Usage: Triggered after the row header cell is rendered, `return false` will not render the row header
- Parameter: 
	- {String} [rowNum]: Row number
	- {Object} [position]:
		+ {Number} [r]: The row number of the cell
		+ {Number} [top]: The vertical coordinate of the upper left corner of the cell
		+ {Number} [width]: Cell width
		+ {Number} [height]: Cell height
	- {Object} [ctx]: The context of the current canvas

------------
### columnTitleCellRenderBefore

- Type: Function
- Default: null
- Usage: Triggered before the column header cell is rendered, `return false` will not render the column header
- Parameter: 
	- {Object} [columnAbc]: Column header characters
	- {Object} [position]:
		- {Number} [c]: The column number of the cell
		- {Number} [left]: The horizontal coordinate of the upper left corner of the cell
		- {Number} [width]: Cell width
		- {Number} [height]: Cell height
	- {Object} [ctx]: The context of the current canvas

------------
### columnTitleCellRenderAfter

- Type: Function
- Default: null
- Usage: Triggered after the column header cell is rendered, `return false` will not render the column header
- Parameter: 
	- {Object} [columnAbc]: Column header characters
	- {Object} [position]:
		- {Number} [c]: The column number of the cell
		- {Number} [left]: The horizontal coordinate of the upper left corner of the cell
		- {Number} [width]: Cell width
		- {Number} [height]: Cell height
	- {Object} [ctx]: The context of the current canvas

------------

## Selected area

### rangeSelect
- Type: Function
- Default: null
- Usage: Frame selection or trigger after setting selection
- Parameter: 
	- {Object} [sheet]: Current worksheet object
	- {Object | Array} [range]: Selection area, may be multiple selection areas

------------

### rangeMoveBefore
- Type: Function
- Default: null
- Usage: Before moving the selection, include a single cell
- Parameter: 
	- {Array} [range]: The current selection area, can only be a single selection area

------------
### rangeMoveAfter
- Type: Function
- Default: null
- Usage: After moving the selection, include a single cell
- Parameter: 
	- {Array} [oldRange]: The current selection range before moving, can only be a single selection
	- {Array} [newRange]: The current selection range after moving, can only be a single selection

------------
### rangeEditBefore
- Type: Function
- Default: null
- Usage: Before the selection
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: Data corresponding to the selection area

------------
### rangeEditAfter
- Type: Function
- Default: null
- Usage: After the selection is modified
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
    - {Object} [oldData]: Before modification, the data corresponding to the selection area
    - {Object} [newData]: After modification, the data corresponding to the selection area

------------
### rangeCopyBefore
- Type: Function
- Default: null
- Usage: Before copying selection
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: Data corresponding to the selection area

------------
### rangeCopyAfter
- Type: Function
- Default: null
- Usage: After copying selection
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: Data corresponding to the selection area

------------
### rangePasteBefore
- Type: Function
- Default: null
- Usage: Before pasting the selection
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: The data corresponding to the selection area to be pasted

------------
### rangePasteAfter
- Type: Function
- Default: null
- Usage: After pasting the selection
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [originData]: The data corresponding to the selection area to be pasted
	- {Object} [pasteData]: Data to paste

------------
### rangeCutBefore
- Type: Function
- Default: null
- Usage: Before selection cut
- Parameter: 
	- {Array} [range]: Selection range, can only be a single range
	- {Object} [data]: The data corresponding to the selection area to be cut

------------
### rangeCutAfter
- Type: Function
- Default: null
- Usage: After selection cut
- Parameter: 
	- {Array} [range]: Selection range, can only be a single range
	- {Object} [data]: The data corresponding to the selection area to be cut

------------
### rangeDeleteBefore
- Type: Function
- Default: null
- Usage: Before the selection is deleted
- Parameter: 
	- {Array} [range]: Selection range, can only be a single range
	- {Object} [data]: The data corresponding to the selection area to be deleted

------------
### rangeDeleteAfter
- Type: Function
- Default: null
- Usage: After the selection is deleted
- Parameter: 
	- {Array} [range]: Selection range, can only be a single range
	- {Object} [data]: The data corresponding to the selection area to be deleted

------------
### rangeClearBefore
- Type: Function
- Default: null
- Usage: Before the selection is cleared
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: The data corresponding to the selection area to be cleared

------------
### rangeClearAfter
- Type: Function
- Default: null
- Usage: After the selection is cleared
- Parameter: 
	- {Object | Array} [range]: Selection area, may be multiple selection areas
	- {Object} [data]: The data corresponding to the selection area to be cleared

------------
### rangePullBefore
- Type: Function
- Default: null
- Usage: Before selection drop down
- Parameter: 
	- {Array} [range]: The current selection range, can only be a single range

------------
### rangePullAfter
- Type: Function
- Default: null
- Usage: After selection drop down
- Parameter: 
	- {Array} [range]: The selection range after the drop-down can only be a single range

------------

## Worksheet

### sheetCreatekBefore
(TODO)
- Type: Function
- Default: null
- Usage: Triggered before the worksheet is created, the new worksheet also includes the new pivot table

------------
### sheetCreateAfter
(TODO)
- Type: Function
- Default: null
- Usage: Triggered after the worksheet is created, the new worksheet also includes the new pivot table
- Parameter: 
	- {Object} [sheet]: The configuration of the newly created worksheet

------------
### sheetMoveBefore
(TODO)
- Type: Function
- Default: null
- Usage: Before the worksheet is moved
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {Number} [order]: `Order` of current worksheet

------------
### sheetMoveAfter
(TODO)
- Type: Function
- Default: null
- Usage: After the worksheet is moved
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {Number} [oldOrder]: Before modification, the `order` of the current worksheet
	- {Number} [newOrder]: After modification, the `order` of the current worksheet

------------
### sheetDeleteBefore
(TODO)
- Type: Function
- Default: null
- Usage: Before the worksheet is deleted
- Parameter: 
	- {Object} [sheet]: Configuration of the worksheet to be deleted

------------
### sheetDeleteAfter
(TODO)
- Type: Function
- Default: null
- Usage: After the worksheet is deleted
- Parameter: 
	- {Object} [sheet]: Configuration of deleted worksheet

------------
### sheetEditNameBefore
(TODO)
- Type: Function
- Default: null
- Usage: Before changing the name of the worksheet
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [name]: Current worksheet name

------------
### sheetEditNameAfter
(TODO)
- Type: Function
- Default: null
- Usage: After changing the name of the worksheet
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [oldName]: Before modification, the current worksheet name
	- {String} [newName]: After modification, the current worksheet name

------------
### sheetEditColorBefore
(TODO)
- Type: Function
- Default: null
- Usage: Before changing the color of the worksheet
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [color]: Current worksheet color

------------
### sheetEditColorAfter
(TODO)
- Type: Function
- Default: null
- Usage: After changing the color of the worksheet
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [oldColor]: Before modification, the current worksheet color
	- {String} [newColor]: After modification, the current worksheet color

------------
### sheetZoomBefore
(TODO)
- Type: Function
- Default: null
- Usage: Before worksheet zoom
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [zoom]: Current worksheet zoom ratio

------------
### sheetZoomAfter
(TODO)
- Type: Function
- Default: null
- Usage: After worksheet zoom
- Parameter: 
	- {Number} [i]: `index` of current worksheet
	- {String} [oldZoom]: Before modification, the current worksheet zoom ratio
	- {String} [newZoom]: After modification, the current worksheet zoom ratio

------------
### sheetActivateBefore
(TODO)
- Type: Function
- Default: null
- Usage：Before worksheet activate
- Parameter：
	- {Number} [i]: `index` of current worksheet

------------
### sheetActivateAfter
(TODO)
- Type: Function
- Default: null
- Usage：After worksheet activate
- Parameter：
	- {Number} [i]: `index` of current worksheet

------------
### sheetDeactivateBefore
（TODO）
- Type: Function
- Default: null
- Usage：Before the worksheet changes from active to inactive
- Parameter：
	- {Number} [i]: `index` of current worksheet

------------
### sheetDeactivateAfter
（TODO）
- Type: Function
- Default: null
- Usage：After the worksheet is changed from active to inactive
- Parameter：
	- {Number} [i]: `index` of current worksheet

------------

## Workbook

### workbookCreateBefore
- Type: Function
- Default: null
- Usage: Triggered before the worksheet is created. The old hook function is called `beforeCreateDom`
- Parameter: 
	- {Object} [book]:Configuration of the entire workbook (options)
    
------------
### workbookCreateAfter
- Type: Function
- Default: null
- Usage: Triggered after the workbook is created
- Parameter: 
	- {Object} [book]:Configuration of the entire workbook (options)
     
------------
### workbookDestroyBefore
- Type: Function
- Default: null
- Usage: Triggered before the workbook is destroyed
- Parameter: 
	- {Object} [book]:Configuration of the entire workbook (options)
    
------------
### workbookDestroyAfter
- Type: Function
- Default: null
- Usage: Triggered after the workbook is destroyed
- Parameter: 
	- {Object} [book]:Configuration of the entire workbook (options)
    
------------
### updated
- Type: Function
- Default: null
- Usage: The method executed after each operation is updated is executed after the canvas rendering, monitor changes in worksheet content, that is, every time the client performs a workbook operation, Luckysheet saves the operation in the history and triggers it. When undoing and redoing, it is also an operation, of course, the hook function will be triggered.
- Parameter: 
	- {Object} [operate]: The history information of this operation will have different history records according to different operations. Refer to the source code [History](https://github.com/mengshukeji/Luckysheet/blob/master/src/controllers/controlHistory.js )
    
------------
### resized
- Type: Function
- Default: null
- Usage: After resize is executed
- Parameter: 
	- {Object} [size]: The width and height of the entire workbook area
    
------------

## Cooperative

### cooperativeMessage

- Type：Function
- Default：null
- Usage：Receive the cooperation message, secondary development. Expanding cooperative message instruction set
- Params:
	- {Object} : Receives the entire collaboration message body object sent by the server

## Image

### imageInsertBefore
- Type: Function
- Default: null
- Usage: Before the picture is inserted
- Parameter: 
	- {Object} [url]: Picture address
    
------------
### imageInsertAfter
- Type: Function
- Default: null
- Usage: After the picture is inserted
- Parameter: 
	- {Object} [item]]: Picture address, width and height, location and other information
    
------------
### imageUpdateBefore
- Type: Function
- Default: null
- Usage: Before the picture is modified, the modified content includes operations such as width and height, position, and cropping
- Parameter: 
	- {Object} [item]]: Picture address, width and height, location and other information
    
------------
### imageUpdateAfter
- Type: Function
- Default: null
- Usage: After the picture is modified, the modified content includes operations such as width and height, position, and cropping
- Parameter: 
	- {Object} [oldItem]]: Before modification, the picture address, width and height, location and other information
	- {Object} [newItem]]: After modification, the picture address, width and height, location and other information
    
------------
### imageDeleteBefore
- Type: Function
- Default: null
- Usage: Before the picture is deleted
- Parameter: 
	- {Object} [item]]: Picture address, width and height, location and other information
    
------------
### imageDeleteAfter
- Type: Function
- Default: null
- Usage: After the picture is deleted
- Parameter: 
	- {Object} [item]]: Picture address, width and height, location and other information
    
------------

## Comment

### commentInsertBefore
- Type: Function
- Default: null
- Usage: Before inserting comments
- Parameter: 
	- {Object} [cell]: The cell information of the comment to be inserted, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`

------------
### commentInsertAfter
- Type: Function
- Default: null
- Usage: After inserting comments
- Parameter: 
	- {Object} [cell]: The cell information where the comment is inserted, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`, contains comment information
    
------------
### commentDeleteBefore
- Type: Function
- Default: null
- Usage: Before deleting comments
- Parameter: 
	- {Object} [cell]: The cell information of the comment to be deleted, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`

------------
### commentDeleteAfter
- Type: Function
- Default: null
- Usage: After deleting the comment
- Parameter: 
	- {Object} [cell]: The cell information of the deleted comment, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`
    
------------
### commentUpdateBefore
- Type: Function
- Default: null
- Usage: Before modifying comments
- Parameter: 
	- {Object} [cell]: The cell information of the comment, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`

------------
### commentUpdateAfter
- Type: Function
- Default: null
- Usage: After modifying the comment
- Parameter: 
	- {Object} [oldCell]: Before modification, the cell information where the comment is located, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`
	- {Object} [newCell]: After modification, the cell information where the comment is located, such as:`{ r:0,c:2,v:{m:'233',v:'233'}}`
    
------------

## Pivot table

### pivotTableEditBefore
- Type: Function
- Default: null
- Usage: Before modifying the PivotTable, operations such as dragging fields, etc.
- Parameter: 
	- {Object} [sheet]: Worksheet configuration where the pivot table is located

------------
### pivotTableEditAfter
- Type: Function
- Default: null
- Usage: After modifying the PivotTable, operations such as dragging fields, etc.
- Parameter: 
	- {Object} [oldSheet]: Before modification, the worksheet configuration where the pivot table is located
	- {Object} [newSheet]: After modification, the worksheet configuration where the pivot table is located
    
------------

## Freeze

### frozenCreateBefore
- Type: Function
- Default: null
- Usage: Before setting freeze
- Parameter: 
	- {Object} [frozen]: Freeze type information

------------
### frozenCreateAfter
- Type: Function
- Default: null
- Usage: After setting freeze
- Parameter: 
	- {Object} [frozen]: Freeze type information
    
------------
### frozenCancelBefore
- Type: Function
- Default: null
- Usage: Before unfreezing
- Parameter: 
	- {Object} [frozen]: Freeze type information

------------
### frozenCancelAfter
- Type: Function
- Default: null
- Usage: After unfreezing
- Parameter: 
	- {Object} [frozen]: Freeze type information
    
------------

#### Legacy Hook Function

### fireMousedown
- Type: Function
- Default: null
- Usage: Customized method of drilling down cell data, note that this hook function is mounted under options: `options.fireMousedown`

------------

## Pager

### onTogglePager

- Type: Function
- Default: null
- Usage: Click the page button to call back the function, return the current page number, refer to [sPage backFun](https://github.com/jvbei/sPage)
- Parameter:
	- {Object} [page]: Return the current page object

------------ -->