# 操作

每当用户在表格上做操作，一个`Op`列表会通过`onOp`回调发出。op描述了如何从当前数据修改为用户操作后的新数据的步骤。例如，当用户在A2单元格上设置了加粗，生成的op如下：

```json
[
    {
        "op": "replace",
        "id": "0",
        "path": ["data", 1, 0, "bl"],
        "value": 1
    }
]
```

op对后端数据修改和同步在线协同数据非常有用。

我们在 `backend-demo` 目录中展示了一个例子，使用 `Express` (后端) and `MongoDB` (数据库) 实现。

通过 `node index.js` 运行后端服务器，然后访问 [Collabration example](https://ruilisi.github.io/online-sheet-demo/?path=/story/collabration--example) 即可体验。

> 可通过 http://localhost:8081/init 初始化数据

## 格式

每个 `Op` 的格式如下

```ts
{
    "op": string,
    "id": string,
    "path": any[],
    "value": any
}
```

其中

| 键 | 描述 |
| ----- | ----------- |
| op | 操作名, 应为 `add`, `remove`, `replce`, `insertRowCol`, `deleteRowCol`, `addSheet`, `deleteSheet` 其中之一 |
| id | 当前Sheet的id  |
| path | 要更新数据的路径 |
| value | 更新的数据 |


## 操作名

| 名称 | 描述 |
| ----- | ----------- |
| add | 在path添加值 |
| replace | 在path替换值 |
| remove | 在path删除值 |
| insertRowCol | 特殊op, 查看 [insertRowCol](#insertrowcol) |
| deleteRowCol | 特殊op, 查看 [deleteRowCol](#deleterowcol) |
| addSheet | 特殊op, 查看 [addSheet](#addsheet) |
| deleteSheet | 特殊op, 查看 [deleteSheet](#deletesheet) |


## 特殊op

特殊op是一些无法用 `add`, `replace` 或 `remove` 表达的操作, 因为用它们表达产生的op过大, 不适合作为op使用.

### insertRowCol

代表用户做了插入行列操作。

此时 `value` 的格式为:

```ts
{
  type: "row" | "column";
  index: number;
  count: number;
  direction: "lefttop" | "rightbottom";
  id: string;
}
```

where

| 名称 | 描述 |
| ----- | ----------- |
| type | `row` 或 `column` |
| index | 要插入行列的起始位置 |
| count | 插入的数量 |
| direction | 插入的方向，`lefttop` 或 `rightbottom` |
| id | 当前操作表格的id |

### deleteRowCol

代表用户做了删除行列操作。

此时 `value` 的格式为:

```ts
{
  type: "row" | "column";
  start: number;
  end: number;
  id: string;
}
```

其中

| 名称 | 描述 |
| ----- | ----------- |
| type | `row` 或 `column` |
| start | 删除行列的起始位置 |
| end | 删除行列的终止位置 |
| id | 当前操作表格的id |

### addSheet

代表用户做了新增表格操作。

此时 `value` 是新表格的完整数据。

### deleteSheet

代表用户做了删除表格操作。

此时 `value` 的格式为:

```ts
{
  id: string;
}
```

其中

| 名称 | 描述 |
| ----- | ----------- |
| id | 要删除的表格id |
