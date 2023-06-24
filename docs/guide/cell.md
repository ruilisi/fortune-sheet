# Format attributes

## Cell attributes table

<table>
    <tr>
        <td>Attribute value</td>
        <td>Full name</td>
        <td><div style="width:100px">Explanation</div></td>
        <td>Example value</td>
        <td>Aspose method or attribute</td>
    </tr>
    <tr>
        <td>ct</td>
        <td>celltype</td>
        <td>Cell value format: text, time, etc.</td>
        <td><a href="#Cell Format">Cell format</a></td>
        <td></td>
    </tr>
    <tr>
        <td>bg</td>
        <td>background</td>
        <td>background color</td>
        <td>#fff000</td>
        <td>setBackgroundColor</td>
    </tr>
    <tr>
        <td>ff</td>
        <td>fontfamily</td>
        <td>Font</td>
        <td>0 Times New Roman, 1 Arial, 2 Tahoma, 3 Verdana, 4 Microsoft Yahei, 5 Song, 6 ST Heiti, 7 ST Kaiti, 8 ST FangSong, 9 ST Song, 10 Chinese New Wei, 11 Chinese Xingkai, 12 Chinese Lishu</td>
        <td>Style.Font object's Name property.</td>
    </tr>
    <tr>
        <td>fc</td>
        <td>fontcolor</td>
        <td>font color</td>
        <td>#fff000</td>
        <td>Style.Font object's Color property</td>
    </tr>
    <tr>
        <td>bl</td>
        <td>bold</td>
        <td>Bold</td>
        <td>0 Regular, 1 Bold</td>
        <td>Style.Font object's IsBold property to true.</td>
    </tr>
    <tr>
        <td>it</td>
        <td>italic</td>
        <td>Italic</td>
        <td>0 Regular, 1 Italic</td>
        <td></td>
    </tr>
    <tr>
        <td>fs</td>
        <td>fontsize</td>
        <td>font size</td>
        <td>14</td>
        <td>Style.Font object's Size property.</td>
    </tr>
    <tr>
        <td>cl</td>
        <td>cancelline</td>
        <td>Cancelline</td>
        <td>0 Regular, 1 Cancelline</td>
        <td>Style.Font object's Underline property</td>
    </tr>
    <tr>
        <td>un</td>
        <td>underline</td>
        <td>underline</td>
        <td>0 none、 1 underline</td>
        <td></td>
    </tr>
    <tr>
        <td>vt</td>
        <td>verticaltype</td>
        <td>Vertical alignment</td>
        <td>0 middle, 1 up, 2 down</td>
        <td>setVerticalAlignment</td>
    </tr>
    <tr>
        <td>ht</td>
        <td>horizontaltype</td>
        <td>Horizontal alignment</td>
        <td>0 center, 1 left, 2 right</td>
        <td>setHorizontalAlignment</td>
    </tr>
    <tr>
        <td>mc</td>
        <td>mergecell</td>
        <td>Merge Cells</td>
        <td>{rs: 10, cs:5} indicates that the cells from this cell to 10 rows and 5 columns are merged.</td>
        <td>Merge</td>
    </tr>
    <tr>
        <td>tr</td>
        <td>textrotate</td>
        <td>Text rotation</td>
        <td>0:  0、1:  45 、2: -45、3 Vertical text、4:  90 、5: -90</td>
        <td>setRotationAngle</td>
    </tr>
    <tr>
        <td>rt</td>
        <td>rotatetext</td>
        <td>rotatetext</td>
        <td>An integer between 0 and 180, including 0 and 180</td>
        <td>setRotationAngle</td>
    </tr>
    <tr>
        <td>tb</td>
        <td>textbeak</td>
        <td>Text wrap</td>
        <td>0 truncation, 1 overflow, 2 word wrap</td>
        <td>2: setTextWrapped <br> 0和1: IsTextWrapped =&nbsp;true</td>
    </tr> 
    <tr>
        <td>v</td>
        <td>value</td>
        <td>Original value</td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>m</td>
        <td>monitor</td>
        <td>Display value</td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td>f</td>
        <td>function</td>
        <td>formula</td>
        <td></td>
        <td>setFormula <br> setArrayFormula <br> workbook.calculateFormula();</td>
    </tr>
    <tr>
        <td>lo</td>
        <td>locked</td>
        <td>Lock the cell, cannot be edited.</td>
        <td>0 is editable,1 is locked. Protected table, default 1; editable table, default 0.</td>
        <td></td>
    </tr>
    <tr>
        <td>ps</td>
        <td>comment</td>
        <td>comment</td>
        <td>
        <code>
        {<br>
            height: 140,//height of comment box <br>
            width: 73,//width of comment box  <br>
            left: 75,//the distance of the comment box from the left edge of the worksheet <br>
            top: 22,//the distance of the comment box from the top edge of the worksheet <br>
            isShow: true,//whether the comment box is shown<br>
            value: "jhbk"//content of comment<br>
        }
        </code>
        </td>
        <td></td>
    </tr>
</table>

A canonical cell object is as follows:

```json
{
    "ct": { //the value format of cell
        "fa": "General",  //name of format is "General"
        "t": "n" //type of the value is number
    },
    "v": 233, //original value is 233
    "m": 233, //displayed value 233
    "bg": "#f6b26b", //background color is "#f6b26b"
    "ff": 1, // font-family is "Arial"
    "fc": "#990000", //font-color is "#990000"
    "bl": 1, //bold
    "it": 1, //italics
    "fs": 9, //font size is 9px
    "cl": 1, //cancel line
    "ht": 0, //horizontal center
    "vt": 0, //vertical center
    "tr": 2, //text rotation is -45°
    "tb": 2, //text wrapping
    "ps": { //comment
        "left": 92, //the distance of the comment box from the left edge of the worksheet
        "top": 10, //the distance of the comment box from the top edge of the worksheet
        "width": 91, //width of comment box
        "height": 48, //height of comment box
        "value": "I am a comment", //content of comment
        "isShow": true //whether the comment box is shown
    },
    "f": "=SUM(233)" //the cell is a sum formula
}
```

### Why there is diffenence between `v` and `m` ?

When FortuneSheet saving data which type is number, there are many formats. So the original value should be saved for subsequent processing. For example, there is a number `1`, when its format is percentage the value displayed should be `100%`, when its format is number with two decimal places the value displayed should be `1.00`.

There is another reason why the content of date and time formats is stored as a number. By default, FortuneSheet stores the original value of `1900-1-1 0:00:00` as `1`, and stores every moment after `1900-1-1 0:00:00` as the difference between that moment and `1900-1-1 0:00:00 `in days. For example, `44127` represents `2020-10-23`.

The following are examples of special formats:

Percentage `100%`
```json
{
    "ct": {
        "fa": "0%",
        "t": "n"
    },
    "v": 1,
    "m": "100%"
}
```

decimal `1.00`
```json
{
    "ct": {
        "fa": "##0.00",
        "t": "n"
    },
    "v": 1,
    "m": "1.00"
}
```

date `2020-10-23`
```json
{
    "ct": {
        "fa": "yyyy-MM-dd",
        "t": "d"
    },
    "v": 44127,
    "m": "2020-10-23"
}
```

## MergeCell

To set a merged cell, you need to make changes in two places. Firstly, set the `mc` attribute in the cell object, and secondly, set `merge` in the `config`.

For example, to merge the cells "A1:B2" into one cell, you can follow these steps:

- Step 1: Set up the parameters for the four cells.
    ```json
    [
        [{
            "m": "merge cell",
            "ct": {
                "fa": "General",
                "t": "g"
            },
            "v": "merge cell",
            "mc": { //essential properties for merging cells
                "r": 0, //row number of the main merged cell
                "c": 0, //column number of the main merged cell
                "rs": 2, //number of rows that the merged cell occupies
                "cs": 2 //Number of columns that the merged cell occupies
            }
        }, {
            "mc": {
                "r": 0, //row number of the main merged cell
                "c": 0, //column number of the main merged cell
            }
        }],
        [{
            "mc": {
                "r": 0, //row number of the main merged cell
                "c": 0, //column number of the main merged cell
            }
        }, {
            "mc": {
                "r": 0, //row number of the main merged cell
                "c": 0, //column number of the main merged cell
            }
        }]
    ]
    ```

    The key property for merging cells is `mc`. The main merged cell is the top-left cell of the selection range and contains four attributes: r/c/rs/cs, representing row/column/rowspan/columnspan. In this case, it means that the cells from the main cell A1 (row 0, column 0) to the cell two rows below and two columns to the right will be merged. The other cells within the selection range only need to set the position of the main cell.

- Step 2: Set `config.merge`
    ```json
    {
        "0_0": {
            "r": 0,
            "c": 0,
            "rs": 2,
            "cs": 2
        }
    }
    ```
    Set config.merge with the key as the concatenated string of `r + '_' + c`, and the value the same as the main merged cell's `mc` settings: r is the row number, c is the column number, rs is the number of rows merged, and cs is the number of columns merged.

> For more details：[config.merge](./sheet.md#configmerge)

## CellWithBorder

Setting the borders of a cell is similar to merging cells. You need to set `borderInfo` in `config`, but you don't need to set the cell object.

For example, set the borderInfo property for cell A1 as border-all with red color:

Set `config.borderInfo` as
```json
{
    "rangeType": "range",
    "borderType": "border-all",
    "color": "#000",
    "style": "1",
    "range": [
        {
            "row": [ 0, 0 ],
            "column": [0, 0]
        }
    ]
}
```
You don't need to add any additional settings to the cell object itself. The following code only includes basic content and format settings:
```json
[
    [
        {
            "m": "borderCell",
            "ct": {
                "fa": "General",
                "t": "g"
            },
            "v": "borderCell"
        }
    ]
]
```

> For more details：[config.borderInfo](./sheet.md#configborderinfo)

## Simplified cell data

It is worth noting that when initializing a table, a one-dimensional array format consisting of `r/c/v` objects is used. The value of `v` is generally set to the cell object. To save backend storage space, the value of `v` supports shorthand format, where a string can be directly written instead of a cell object. This is automatically recognized as an automatic format once rendered in FortuneSheet, as indicated by `"ct": { "fa": "General", "t": "n" }`.

The following is the storage of 3 cells:
```json
[
    {
        "r": 10,
        "c": 11,
        "v": {
            "f": "=MAX(A7:A9)",
            "ct": {
                "fa": "General",
                "t": "n"
            },
            "v": 100,
            "m": "100"
        }
    },
    {
        "r": 0,
        "c": 1,
        "v": {
            "v": 12,
            "f": "=SUM(A2)",
            "bg": "#fff000"
        }
    },
    {
        "r": 10,
        "c": 11,
        "v": "value 2"
    }
]
```
>  For more details [usage of celldata](./sheet.md#celldata)

## Cell format


The format is set to:

```json
{
    "ct": {
        "fa": "General",
        "t": "g"
    },
    "m": "2424",
    "v": 2424
}
```

| Param | Description | Value |
| ------------ | ------------ | ------------ |
| fa | The format string for defining a format | Such as "General" |
| t | Type | Such as "g" |


### The optional settings are as follows

|Parameter|Explanation|Value|
| ------------ | ------------ | ------------ |
|fa|Format definition string| such as "General"|
|t|Type|Such as "g"|

The available settings are as follows:
| Format | ct.fa | ct.t | Example of m value | Remarks |
|----------|----------|-------------------------|------------------------- |------------------------- |
| Automatic | General | g | Luckysheet |Automatic format, which is also the default format; When the cell content is a number, the value of `m` is `'n'`|
| Plain text | @ | s | Luckysheet ||
| <br><br><br>**Number Format** | | | | |
| Integer | 0 | n | 1235 | 0 decimal places |
| One decimal place of the number | 0.0 | n | 1234.6 | The number of 0 after the dot represents the number of decimal places. If the original number is large, the number of digits will be rounded to the nearest hour |
| Two decimal places | 0.00 | n | 1234.56 ||
| Percentage integer | 0% | n | 123456% |The usage of #0% is also supported|
| Percentage | 0.00% | n | 123456.00% |The usage of #0.00% is also supported. The number of 0 after the dot represents the number of decimal places|
| Scientific Notation | 0.00E+00 | n | 1.23E+03 ||
| Scientific Notation | ##0.0E+0 | n | 1.2E+3 ||
| Fractions | # ?/? | n | 1234 5/9 ||
| Score | # ??/?? | n | 1234 14/25 ||
| Ten thousand | w | n |123 thousand and 456||
| Ten thousand two decimal places | w0.00 | n |123 thousand and 3456.00 ||
| Accounting | ¥(0.00) | n ||
| More number formats | #,##0 | n | 1,235 ||
| More number formats | #,##0.00 | n | 1,234.56 ||
| More number formats | `#,##0_);(#,##0)` | n | 1,235 ||
| More number formats | `#,##0_);[Red](#,##0)` | n | 1,235 ||
| More number formats | `#,##0.00_);(#,##0.00)` | n | 1,234.56 ||
| More number formats | `#,##0.00_);[Red](#,##0.00)` | n | 1,234.56 ||
| More number formats | $#,##0_);($#,##0) | n | $1,235 ||
| More number formats | `$#,##0_);[Red]($#,##0)` | n | $1,235 ||
| More number formats | $#,##0.00_);($#,##0.00) | n | $1,234.56 ||
| More number formats | `$#,##0.00_);[Red]($#,##0.00)` | n | $1,234.56 ||
| More number formats | _($* #,##0_);_(...($* "-"_);_(@_) | n | $ 1,235 ||
| More number formats | _(* #,##0_);_(*..._(* "-"_);_(@_) | n | 1,235 ||
| More number formats | _($* #,##0.00_);_(...($* "-"_);_(@_) | n | $ 1,234.56 ||
| More number formats | _(* #,##0.00_);...* "-"??_);_(@_) | n | 1,234.56 ||
| <br><br><br>**Time and Date Format** | | | | |
| Time | hh:mm AM/PM | d |10:23 AM||
| Time 24H | hh:mm | d |10:23||
| Date Time | yyyy-MM-dd hh:mm AM/PM | d |2020-07-29 10:23 AM||
| Date Time 24H | yyyy-MM-dd hh:mm | d |2020-07-29 10:23||
| Date | yyyy-MM-dd | d | 1930-08-05 ||
| Date | yyyy/MM/dd | d | 1930/8/5 ||
| Date | yyyy "year" M" month "d" day" | d | August 5, 1930 ||
| Date | MM-dd | d | 08-05 ||
| Date | M-d | d | 8-5 ||
| Date | M"Month"d"Day" | d | August 5th ||
| Date | h:mm:ss | d | 13:30:30 ||
| Date | h:mm | d | 13:30 ||
| Date | AM/PM hh:mm | d | 01:30 PM ||
| Date | AM/PM h:mm | d | 1:30 PM ||
| Date | AM/PM h:mm:ss | d | 1:30:30 PM ||
| Date | MM-dd AM/PM hh:mm | d | Next 08-05 01:30 PM ||
| <br><br><br>**Currency Format** | | | | |
| Currency: RMB | "¥" 0.00 | n | ¥ 123.00 | Also supports ¥ #.00 or ¥0.00|
| Currency: US Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Euro | "€" 0.00 | n | € 123.00 ||
| Currency: British Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Hong Kong Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Japanese Yen | "￥" 0.00 | n | ￥123.00 ||
| Currency: Albanian Lek | "Lek" 0.00 | n | Lek 123.00 ||
| Currency: Algerian Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Afghani | "Af" 0.00 | n | Af 123.00 ||
| Currency: Argentine Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: United Arab Emirates Dirham | "dh" 0.00 | n | dh 123.00 ||
| Currency: Aruban Florin | "Afl" 0.00 | n | Afl 123.00 ||
| Currency: Omani Rial | "Rial" 0.00 | n | Rial 123.00 ||
| Currency: Azerbaijani Manat | "?" 0.00 | n |? 123.00 ||
| Currency: Egyptian Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Ethiopian Birr | "Birr" 0.00 | n | Birr 123.00 ||
| Currency: Angolan Kwanza | "Kz" 0.00 | n | Kz 123.00 ||
| Currency: Australian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Macau Patacas | "MOP" 0.00 | n | MOP 123.00 ||
| Currency: Barbadian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Papua New Guinea Kina | "PGK" 0.00 | n | PGK 123.00 ||
| Currency: Bahamian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Pakistani Rupee | "Rs" 0.00 | n | Rs 123.00 ||
| Currency: Paraguayan Guarani | "Gs" 0.00 | n | Gs 123.00 ||
| Currency: Bahraini Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Panamanian Balboa | "B/" 0.00 | n | B/ 123.00 ||
| Currency: Brazilian Riyal | "R$" 0.00 | n | R$ 123.00 ||
| Currency: Belarusian ruble | "р" 0.00 | n | р 123.00 ||
| Currency: Bermudian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Bulgarian Lev | "lev" 0.00 | n | lev 123.00 ||
| Currency: Iceland Krona | "kr" 0.00 | n | kr 123.00 ||
| Currency: Bosnia and Herzegovina convertible mark | "KM" 0.00 | n | KM 123.00 ||
| Currency: Polish Zloty | "z?" 0.00 | n | z? 123.00 ||
| Currency: Boliviano | "Bs" 0.00 | n | Bs 123.00 ||
| Currency: Belize Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Botswana Pula | "P" 0.00 | n | P 123.00 ||
| Currency: Bhutan Nusam | "Nu" 0.00 | n | Nu 123.00 ||
| Currency: Burundian Franc | "FBu" 0.00 | n | FBu 123.00 ||
| Currency: North Korean Won | "?KP" 0.00 | n | ?KP 123.00 ||
| Currency: Danish Krone | "kr" 0.00 | n | kr 123.00 ||
| Currency: East Caribbean Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Dominican Peso | "RD$" 0.00 | n | RD$ 123.00 ||
| Currency: Russian ruble | "?" 0.00 | n |? 123.00 ||
| Currency: Eritrean Nakfa | "Nfk" 0.00 | n | Nfk 123.00 ||
| Currency: CFA franc | "CFA" 0.00 | n | CFA 123.00 ||
| Currency: Philippine Peso | "?" 0.00 | n |? 123.00 ||
| Currency: Fijian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Cape Verde Escudo | "CVE" 0.00 | n | CVE 123.00 ||
| Currency: Falkland Islands Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Gambia Dalasi | "GMD" 0.00 | n | GMD 123.00 ||
| Currency: Congolese Franc | "FrCD" 0.00 | n | FrCD 123.00 ||
| Currency: Colombian Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: Costa Rican Colon | "?" 0.00 | n |? 123.00 ||
| Currency: Cuban Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: Cuban Convertible Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: Guyana Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Kazakhstan tenge | "?" 0.00 | n |? 123.00 ||
| Currency: Haitian Gourde | "HTG" 0.00 | n | HTG 123.00 ||
| Currency: Korean Won | "?" 0.00 | n |? 123.00 ||
| Currency: Netherlands Antilles Guild | "NAf." 0.00 | n | NAf. 123.00 ||
| Currency: Honduras Lalempira | "L" 0.00 | n | L 123.00 ||
| Currency: Djiboutian Franc | "Fdj" 0.00 | n | Fdj 123.00 ||
| Currency: Kyrgyzstan Som | "KGS" 0.00 | n | KGS 123.00 ||
| Currency: Guinean Franc | "FG" 0.00 | n | FG 123.00 ||
| Currency: Canadian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Ghanaian Cedi | "GHS" 0.00 | n | GHS 123.00 ||
| Currency: Cambodian Riel | "Riel" 0.00 | n | Riel 123.00 ||
| Currency: Czech Koruna | "K?" 0.00 | n | K? 123.00 ||
| Currency: Zimbabwe dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Qatari Rial | "Rial" 0.00 | n | Rial 123.00 ||
| Currency: Cayman Islands Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Comorian Franc | "CF" 0.00 | n | CF 123.00 ||
| Currency: Kuwaiti Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Croatian Kuna | "kn" 0.00 | n | kn 123.00 ||
| Currency: Kenyan Shilling | "Ksh" 0.00 | n | Ksh 123.00 ||
| Currency: Lesotho Loti | "LSL" 0.00 | n | LSL 123.00 ||
| Currency: Lao Kip | "?" 0.00 | n |? 123.00 ||
| Currency: Lebanese Pound | "L￡" 0.00 | n | L￡ 123.00 ||
| Currency: Lithuanian Litas | "Lt" 0.00 | n | Lt 123.00 ||
| Currency: Libyan Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Libyan Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Rwandan franc | "RF" 0.00 | n | RF 123.00 ||
| Currency: Romanian Lei | "RON" 0.00 | n | RON 123.00 ||
| Currency: Madagascar Ariary | "Ar" 0.00 | n | Ar 123.00 ||
| Currency: Maldivian Rufiyaa | "Rf" 0.00 | n | Rf 123.00 ||
| Currency: Malawian Kwacha | "MWK" 0.00 | n | MWK 123.00 ||
| Currency: Malaysian Ringgit | "RM" 0.00 | n | RM 123.00 ||
| Currency: Macedonian Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Mauritian Rupee | "MURs" 0.00 | n | MURs 123.00 ||
| Currency: Mauritania Ouguiya | "MRO" 0.00 | n | MRO 123.00 ||
| Currency: Mongolian Tugrik | "?" 0.00 | n |? 123.00 ||
| Currency: Bangladeshi Taka | "?" 0.00 | n |? 123.00 ||
| Currency: Peruvian New Sol | "S/" 0.00 | n | S/ 123.00 ||
| Currency: Myanmar Kyat | "K" 0.00 | n | K 123.00 ||
| Currency: Moldovan Lei | "MDL" 0.00 | n | MDL 123.00 ||
| Currency: Moroccan Dirham | "dh" 0.00 | n | dh 123.00 ||
| Currency: Mozambique Metical | "MTn" 0.00 | n | MTn 123.00 ||
| Currency: Mexican Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: Namibian Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: South African Rand | "R" 0.00 | n | R 123.00 ||
| Currency: South Sudanese Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Nicaragua Cordoba | "C$" 0.00 | n | C$ 123.00 ||
| Currency: Nepalese Rupee | "Rs" 0.00 | n | Rs 123.00 ||
| Currency: Nigerian Naira | "?" 0.00 | n |? 123.00 ||
| Currency: Norwegian Krone | "kr" 0.00 | n | kr 123.00 ||
| Currency: Georgia Lari | "GEL" 0.00 | n | GEL 123.00 ||
| Currency: RMB (Offshore) | "￥" 0.00 | n | ￥123.00 ||
| Currency: Swedish Krona | "kr" 0.00 | n | kr 123.00 ||
| Currency: Swiss Franc | "CHF" 0.00 | n | CHF 123.00 ||
| Currency: Serbian Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Sierra Leone Leone | "SLL" 0.00 | n | SLL 123.00 ||
| Currency: Seychelles Rupee | "SCR" 0.00 | n | SCR 123.00 ||
| Currency: Saudi Riyal | "Rial" 0.00 | n | Rial 123.00 ||
| Currency: Sao Tome Dobra | "Db" 0.00 | n | Db 123.00 ||
| Currency: St. Helena Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Sri Lankan Rupee | "Rs" 0.00 | n | Rs 123.00 ||
| Currency: Swaziland Lilangeni | "SZL" 0.00 | n | SZL 123.00 ||
| Currency: Sudanese Pound | "SDG" 0.00 | n | SDG 123.00 ||
| Currency: Surinamese Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Solomon Islands Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Somali Shilling | "SOS" 0.00 | n | SOS 123.00 ||
| Currency: Tajikistani Somoni | "Som" 0.00 | n | Som 123.00 ||
| Currency: Pacific Franc | "FCFP" 0.00 | n | FCFP 123.00 ||
| Currency: Thai Baht | "?" 0.00 | n |? 123.00 ||
| Currency: Tanzanian Shilling | "TSh" 0.00 | n | TSh 123.00 ||
| Currency: Tongan Paanga | "T$" 0.00 | n | T$ 123.00 ||
| Currency: Trinidad and Tobago Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Tunisian Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Turkish Lira | "?" 0.00 | n |? 123.00 ||
| Currency: Vanuatu Vatu | "VUV" 0.00 | n | VUV 123.00 ||
| Currency: Guatemalan Quetzal | "Q" 0.00 | n | Q 123.00 ||
| Currency: Venezuelan Bolivar | "Bs" 0.00 | n | Bs 123.00 ||
| Currency: Brunei Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Ugandan Shilling | "UGX" 0.00 | n | UGX 123.00 ||
| Currency: Ukrainian Hryvnia | "грн." 0.00 | n | грн. 123.00 ||
| Currency: Uruguayan Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: Uzbekistani Sum | "so?m" 0.00 | n | so?m 123.00 ||
| Currency: Western Samoa Tala | "WST" 0.00 | n | WST 123.00 ||
| Currency: Singapore Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: New Taiwan Dollar | "NT$" 0.00 | n | NT$ 123.00 ||
| Currency: New Zealand Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Hungarian Forint | "Ft" 0.00 | n | Ft 123.00 ||
| Currency: Syrian Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Jamaican Dollar | "$" 0.00 | n | $ 123.00 ||
| Currency: Armenian Dram | "Dram" 0.00 | n | Dram 123.00 ||
| Currency: Yemeni Rial | "Rial" 0.00 | n | Rial 123.00 ||
| Currency: Iraqi Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Iranian Rial | "Rial" 0.00 | n | Rial 123.00 ||
| Currency: Israeli New Shekel | "?" 0.00 | n |? 123.00 ||
| Currency: Indian Rupee | "?" 0.00 | n |? 123.00 ||
| Currency: Indonesian Rupiah | "Rp" 0.00 | n | Rp 123.00 ||
| Currency: Jordanian Dinar | "din" 0.00 | n | din 123.00 ||
| Currency: Vietnamese Dong | "?" 0.00 | n |? 123.00 ||
| Currency: Zambian Kwacha | "ZMW" 0.00 | n | ZMW 123.00 ||
| Currency: Gibraltar Pound | "￡" 0.00 | n | ￡ 123.00 ||
| Currency: Chilean Peso | "$" 0.00 | n | $ 123.00 ||
| Currency: China-Africa Financial Cooperation Franc | "FCFA" 0.00 | n | FCFA 123.00 ||

Notice: Import/export only considers the data style that the user sees. For example, the way to process the date format in excel is to convert the date into a number: 42736 represents 2017-1-1.

Reference[Aspose.Cells](https://docs.aspose.com/display/cellsnet/List+of+Supported+Number+Formats#ListofSupportedNumberFormats-Aspose.Cells)
