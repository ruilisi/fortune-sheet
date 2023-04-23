import {
  colLocationByIndex,
  Context,
  diff,
  getcellrange,
  getCellValue,
  getFlowdata,
  getRangeByTxt,
  getSheetIndex,
  GlobalCache,
  isAllowEdit,
  iscelldata,
  isdatetime,
  isRealNull,
  isRealNum,
  mergeBorder,
  rowLocationByIndex,
  setCellValue,
} from "..";

// TODO: 后期增加鼠标可以选择多个选区
// 开启范围选区
export function dataRangeSelection(
  ctx: Context,
  cache: GlobalCache,
  rangT: string,
  type: string,
  value: string
) {
  ctx.rangeDialog!.show = true;
  ctx.rangeDialog!.type = type;
  ctx.rangeDialog!.rangeTxt = value;
  if (ctx.luckysheet_select_save && !!rangT) {
    const last =
      ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
    const row_index = last.row_focus as number;
    const col_index = last.column_focus as number;
    ctx.luckysheetCellUpdate = [row_index, col_index];

    const range = getRangeByTxt(ctx, rangT);
    const r = range[0].row;
    const c = range[0].column;

    const row_pre = rowLocationByIndex(r[0], ctx.visibledatarow)[0];
    const row = rowLocationByIndex(r[1], ctx.visibledatarow)[1];
    const col_pre = colLocationByIndex(c[0], ctx.visibledatacolumn)[0];
    const col = colLocationByIndex(c[1], ctx.visibledatacolumn)[1];

    ctx.formulaRangeSelect = {
      height: row - row_pre - 1,
      left: col_pre,
      rangeIndex: ctx.formulaRangeSelect?.rangeIndex ?? 0,
      top: row_pre,
      width: col - col_pre - 1,
    };
  } else {
    ctx.luckysheetCellUpdate = [0, 0];
  }

  // cache.doNotUpdateCell = true;
  // ctx.formulaCache.rangestart = true;
  // ctx.formulaCache.rangedrag_column_start = false;
  // ctx.formulaCache.rangedrag_row_start = false;
  // ctx.formulaCache.rangechangeindex = 0;
}

export function getDropdownList(ctx: Context, txt: string) {
  const list: (string | number | boolean)[] = [];
  if (iscelldata(txt)) {
    const range = getcellrange(ctx, txt);
    const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
    const d = ctx.luckysheetfile[index].data;
    if (!d) return [];
    for (let r = range.row[0]; r <= range.row[1]; r += 1) {
      for (let c = range.column[0]; c <= range.column[1]; c += 1) {
        if (!d[r]) {
          continue;
        }

        const cell = d[r][c];

        if (!cell || !cell.v) {
          continue;
        }

        const v = cell.m || cell.v;

        if (!list.includes(v)) {
          list.push(v);
        }
      }
    }
  } else {
    const arr = txt.split(",");

    for (let i = 0; i < arr.length; i += 1) {
      const v = arr[i];

      if (v.length === 0) {
        continue;
      }

      if (!list.includes(v)) {
        list.push(v);
      }
    }
  }
  return list;
}

// 身份证
export function validateIdCard(ctx: Context, idCard: string) {
  // 15位和18位身份证号码的正则表达式
  const regIdCard =
    /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/;

  // 如果通过该验证，说明身份证格式正确，但准确性还需计算
  if (regIdCard.test(idCard)) {
    if (idCard.length === 18) {
      const idCardWi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]; // 将前17位加权因子保存在数组里
      const idCardY = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 这是除以11后，可能产生的11位余数、验证码，也保存成数组
      let idCardWiSum = 0; // 用来保存前17位各自乖以加权因子后的总和
      for (let i = 0; i < 17; i += 1) {
        idCardWiSum += Number(idCard.substring(i, i + 1)) * idCardWi[i];
      }

      const idCardMod = idCardWiSum % 11; // 计算出校验码所在数组的位置
      const idCardLast = idCard.substring(17); // 得到最后一位身份证号码

      // 如果等于2，则说明校验码是10，身份证号码最后一位应该是X
      if (idCardMod === 2) {
        if (idCardLast === "X" || idCardLast === "x") {
          return true;
        }
        return false;
      }
      // 用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
      if (idCardLast === idCardY[idCardMod].toString()) {
        return true;
      }
      return false;
    }
  } else {
    return false;
  }
  return false;
}

// 数据验证
export function validateCellData(ctx: Context, item: any, cellValue: any) {
  let { value1, value2 } = item;
  const { type, type2 } = item;
  if (type === "dropdown") {
    const list = getDropdownList(ctx, value1);

    // 多选的情况 检查每个都在下拉列表中
    if (type2 && cellValue) {
      return cellValue
        .toString()
        .split(",")
        .every((i: any) => {
          return list.indexOf(i) !== -1;
        });
    }

    let result = false;

    for (let i = 0; i < list.length; i += 1) {
      if (list[i] === cellValue) {
        result = true;
        break;
      }
    }

    return result;
  }
  if (type === "checkbox") {
  } else if (
    type === "number" ||
    type === "number_integer" ||
    type === "number_decimal"
  ) {
    if (!isRealNum(cellValue)) {
      return false;
    }

    cellValue = Number(cellValue);
    if (type === "number_integer" && cellValue % 1 !== 0) {
      return false;
    }

    if (type === "number_decimal" && cellValue % 1 === 0) {
      return false;
    }

    value1 = Number(value1);
    value2 = Number(value2);

    if (type2 === "between" && (cellValue < value1 || cellValue > value2)) {
      return false;
    }

    if (type2 === "notBetween" && cellValue >= value1 && cellValue <= value2) {
      return false;
    }

    if (type2 === "equal" && cellValue !== value1) {
      return false;
    }

    if (type2 === "notEqualTo" && cellValue === value1) {
      return false;
    }

    if (type2 === "moreThanThe" && cellValue <= value1) {
      return false;
    }

    if (type2 === "lessThan" && cellValue >= value1) {
      return false;
    }

    if (type2 === "greaterOrEqualTo" && cellValue < value1) {
      return false;
    }

    if (type2 === "lessThanOrEqualTo" && cellValue > value1) {
      return false;
    }
  } else if (type === "text_content") {
    cellValue = cellValue.toString();
    value1 = value1.toString();

    if (type2 === "include" && cellValue.indexOf(value1) === -1) {
      return false;
    }

    if (type2 === "exclude" && cellValue.indexOf(value1) > -1) {
      return false;
    }

    if (type2 === "equal" && cellValue !== value1) {
      return false;
    }
  } else if (type === "text_length") {
    cellValue = cellValue.toString().length;

    value1 = Number(value1);
    value2 = Number(value2);

    if (type2 === "between" && (cellValue < value1 || cellValue > value2)) {
      return false;
    }

    if (type2 === "notBetween" && cellValue >= value1 && cellValue <= value2) {
      return false;
    }

    if (type2 === "equal" && cellValue !== value1) {
      return false;
    }

    if (type2 === "notEqualTo" && cellValue === value1) {
      return false;
    }

    if (type2 === "moreThanThe" && cellValue <= value1) {
      return false;
    }

    if (type2 === "lessThan" && cellValue >= value1) {
      return false;
    }

    if (type2 === "greaterOrEqualTo" && cellValue < value1) {
      return false;
    }

    if (type2 === "lessThanOrEqualTo" && cellValue > value1) {
      return false;
    }
  } else if (type === "date") {
    if (!isdatetime(cellValue)) {
      return false;
    }

    if (
      type2 === "between" &&
      (diff(cellValue, value1) < 0 || diff(cellValue, value2) > 0)
    ) {
      return false;
    }

    if (
      type2 === "notBetween" &&
      diff(cellValue, value1) >= 0 &&
      diff(cellValue, value2) <= 0
    ) {
      return false;
    }

    if (type2 === "equal" && diff(cellValue, value1) !== 0) {
      return false;
    }

    if (type2 === "notEqualTo" && diff(cellValue, value1) === 0) {
      return false;
    }

    if (type2 === "earlierThan" && diff(cellValue, value1) >= 0) {
      return false;
    }

    if (type2 === "noEarlierThan" && diff(cellValue, value1) < 0) {
      return false;
    }

    if (type2 === "laterThan" && diff(cellValue, value1) <= 0) {
      return false;
    }

    if (type2 === "noLaterThan" && diff(cellValue, value1) > 0) {
      return false;
    }
  } else if (type === "validity") {
    if (type2 === "identificationNumber" && !validateIdCard(ctx, cellValue)) {
      return false;
    }

    if (type2 === "phoneNumber" && !/^1[3456789]\d{9}$/.test(cellValue)) {
      return false;
    }
  }
  return true;
}

// 复选框处理
export function checkboxChange(ctx: Context, r: number, c: number) {
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  // let historyDataVerification = $.extend(true, {}, _this.dataVerification);
  const currentDataVerification =
    ctx.luckysheetfile[index].dataVerification ?? {};
  const item = currentDataVerification[`${r}_${c}`];
  item.checked = !item.checked;
  let value = item.value2;
  if (item.checked) {
    value = item.value1;
  }
  const d = getFlowdata(ctx);
  setCellValue(ctx, r, c, d, value);
}

// 数据无效时的提示信息
export function getFailureText(ctx: Context, item: any) {
  let failureText = "";
  const { lang } = ctx;

  const { type, type2, value1, value2 } = item;
  if (lang === "en") {
    const optionLabel_en = ctx.dataVerification?.optionLabel_en;
    if (type === "dropdown") {
      failureText += "what you selected is not an option in the drop-down list";
    } else if (type === "checkbox") {
    } else if (
      type === "number" ||
      type === "number_integer" ||
      type === "number_decimal"
    ) {
      failureText += `what you entered is not a ${optionLabel_en[item.type]} ${
        optionLabel_en[item.type2]
      } ${item.value1}`;

      if (item.type2 === "between" || item.type2 === "notBetween") {
        failureText += ` and ${item.value2}`;
      }
    } else if (type === "text_content") {
      failureText += `what you entered is not text that ${
        optionLabel_en[item.type2]
      } ${item.value1}`;
    } else if (type === "text_length") {
      failureText += `the text you entered is not length ${
        optionLabel_en[item.type2]
      } ${item.value1}`;

      if (item.type2 === "between" || item.type2 === "notBetween") {
        failureText += ` and ${item.value2}`;
      }
    } else if (type === "date") {
      failureText += `the date you entered is not ${
        optionLabel_en[item.type2]
      } ${item.value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += ` and ${item.value2}`;
      }
    } else if (type === "validity") {
      failureText += `what you entered is not a correct ${
        optionLabel_en[item.type2]
      }`;
    }
  } else if (lang === "zh" || lang === "zh-CN") {
    const optionLabel_zh = ctx.dataVerification?.optionLabel_zh;
    if (type === "dropdown") {
      failureText += "你选择的不是下拉列表中的选项";
    } else if (type === "checkbox") {
    } else if (
      type === "number" ||
      type === "number_integer" ||
      type === "number_decimal"
    ) {
      failureText += `你输入的不是${optionLabel_zh[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之间`;
      }

      failureText += `的${optionLabel_zh[type]}`;
    } else if (type === "text_content") {
      failureText += `你输入的不是内容${optionLabel_zh[type2]}${value1}的文本`;
    } else if (type === "text_length") {
      failureText += `你输入的不是长度${optionLabel_zh[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之间`;
      }

      failureText += "的文本";
    } else if (type === "date") {
      failureText += `你输入的不是${optionLabel_zh[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之间`;
      }

      failureText += "的日期";
    } else if (type === "validity") {
      failureText += `你输入的不是一个正确的${optionLabel_zh[type2]}`;
    }
  } else if (lang === "zh-TW") {
    const optionLabel_zh_tw = ctx.dataVerification?.optionLabel_zh_tw;
    if (type === "dropdown") {
      failureText += "你選擇的不是下拉清單中的選項";
    } else if (type === "checkbox") {
    } else if (
      type === "number" ||
      type === "number_integer" ||
      type === "number_decimal"
    ) {
      failureText += `你輸入的不是${optionLabel_zh_tw[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之間`;
      }

      failureText += `的${optionLabel_zh_tw[type]}`;
    } else if (type === "text_content") {
      failureText += `你輸入的不是內容${optionLabel_zh_tw[type2]}${value1}的文本`;
    } else if (type === "text_length") {
      failureText += `你輸入的不是長度${optionLabel_zh_tw[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之间`;
      }

      failureText += "的文本";
    } else if (type === "date") {
      failureText += `你輸入的不是${optionLabel_zh_tw[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `和${value2}之间`;
      }

      failureText += "的日期";
    } else if (type === "validity") {
      failureText += `你輸入的不是一個正確的${optionLabel_zh_tw[type2]}`;
    }
  } else if (lang === "es") {
    const optionLabel_es = ctx.dataVerification?.optionLabel_es;
    if (type === "dropdown") {
      failureText += "No elegiste una opción en la lista desplegable";
    } else if (type === "checkbox") {
    } else if (
      type === "number" ||
      type === "number_integer" ||
      type === "number_decimal"
    ) {
      failureText += `Lo que introduciste no es${optionLabel_es[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `Y${value2}Entre`;
      }

      failureText += `De${optionLabel_es[type]}`;
    } else if (type === "text_content") {
      failureText += `Lo que introduciste no fue contenido${optionLabel_es[type2]}${value1}Texto`;
    } else if (type === "text_length") {
      failureText += `No introduciste la longitud${optionLabel_es[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `Y${value2}Entre`;
      }

      failureText += "Texto";
    } else if (type === "date") {
      failureText += `Lo que introduciste no es${optionLabel_es[type2]}${value1}`;

      if (type2 === "between" || type2 === "notBetween") {
        failureText += `Y${value2}Entre`;
      }

      failureText += "Fecha";
    } else if (type === "validity") {
      failureText += `Lo que ingresas no es correcto${optionLabel_es[type2]}`;
    }
  }
  return failureText;
}

// 获得提示内容
export function getHintText(ctx: Context, item: any) {
  let hintValue = item.hintValue || "";
  const { type, type2, value1, value2 } = item;
  const { lang } = ctx;

  if (!hintValue) {
    if (lang === "en") {
      const optionLabel_en = ctx.dataVerification?.optionLabel_en;
      if (type === "dropdown") {
        hintValue += "please select an option in the drop-down list";
      } else if (type === "checkbox") {
      } else if (
        type === "number" ||
        type === "number_integer" ||
        type === "number_decimal"
      ) {
        hintValue += `please enter a ${optionLabel_en[type]} ${optionLabel_en[type2]} ${item.value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += ` and ${value2}`;
        }
      } else if (type === "text_content") {
        hintValue += `please enter text ${optionLabel_en[type2]} ${value1}`;
      } else if (type === "date") {
        hintValue += `please enter a date ${optionLabel_en[type2]} ${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += ` and ${value2}`;
        }
      } else if (type === "validity") {
        hintValue += `please enter the correct ${optionLabel_en[type2]}`;
      }
    } else if (lang === "zh" || lang === "zh-CN") {
      const optionLabel_zh = ctx.dataVerification?.optionLabel_zh;
      if (type === "dropdown") {
        hintValue += "请选择下拉列表中的选项";
      } else if (type === "checkbox") {
      } else if (
        type === "number" ||
        type === "number_integer" ||
        type === "number_decimal"
      ) {
        hintValue += `请输入${optionLabel_zh[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之间`;
        }

        hintValue += `的${optionLabel_zh[type]}`;
      } else if (type === "text_content") {
        hintValue += `请输入内容${optionLabel_zh[type2]}${value1}的文本`;
      } else if (type === "text_length") {
        hintValue += `请输入长度${optionLabel_zh[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之间`;
        }

        hintValue += "的文本";
      } else if (type === "date") {
        hintValue += `请输入${optionLabel_zh[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之间`;
        }

        hintValue += "的日期";
      } else if (type === "validity") {
        hintValue += `请输入正确的${optionLabel_zh[type2]}`;
      }
    } else if (lang === "zh-TW") {
      const optionLabel_zh_tw = ctx.dataVerification?.optionLabel_zh_tw;
      if (type === "dropdown") {
        hintValue += "請選擇下拉清單中的選項";
      } else if (type === "checkbox") {
      } else if (
        type === "number" ||
        type === "number_integer" ||
        type === "number_decimal"
      ) {
        hintValue += `請輸入${optionLabel_zh_tw[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之間`;
        }

        hintValue += `的${optionLabel_zh_tw[type]}`;
      } else if (type === "text_content") {
        hintValue += `請輸入內容${optionLabel_zh_tw[type2]}${value1}的文本`;
      } else if (type === "text_length") {
        hintValue += `請輸入長度${optionLabel_zh_tw[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之間`;
        }

        hintValue += "的文本";
      } else if (type === "date") {
        hintValue += `請輸入${optionLabel_zh_tw[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `和${value2}之間`;
        }

        hintValue += "的日期";
      } else if (type === "validity") {
        hintValue += `請輸入正確的${optionLabel_zh_tw[type2]}`;
      }
    } else if (lang === "es") {
      const optionLabel_es = ctx.dataVerification?.optionLabel_es;
      if (type === "dropdown") {
        hintValue += "Por favor, elija una opción en la lista desplegable";
      } else if (type === "checkbox") {
      } else if (
        type === "number" ||
        type === "number_integer" ||
        type === "number_decimal"
      ) {
        hintValue += `Por favor, introduzca${optionLabel_es[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `Y${value2}Entre`;
        }

        hintValue += `De${optionLabel_es[type]}`;
      } else if (type === "text_content") {
        hintValue += `Por favor, introduzca el contenido${optionLabel_es[type2]}${value1}Texto`;
      } else if (type === "text_length") {
        hintValue += `Por favor, introduzca la longitud${optionLabel_es[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `Y${value2}Entre`;
        }

        hintValue += "Texto";
      } else if (type === "date") {
        hintValue += `Por favor, introduzca${optionLabel_es[type2]}${value1}`;

        if (type2 === "between" || type2 === "notBetween") {
          hintValue += `Y${value2}Entre`;
        }

        hintValue += "Fecha";
      } else if (type === "validity") {
        hintValue += `Por favor, introduzca lo correcto.${optionLabel_es[type2]}`;
      }
    }
  }

  return hintValue;
}

// 单元格聚焦处理
export function cellFocus(
  ctx: Context,
  r: number,
  c: number,
  clickMode: boolean
) {
  const allowEdit = isAllowEdit(ctx);
  if (!allowEdit) return;
  const showHintBox = document.getElementById(
    "luckysheet-dataVerification-showHintBox"
  );
  const dropDownBtn = document.getElementById(
    "luckysheet-dataVerification-dropdown-btn"
  );
  ctx.dataVerificationDropDownList = false;
  if (!showHintBox || !dropDownBtn) return;
  showHintBox.style.display = "none";
  dropDownBtn.style.display = "none";
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  const { dataVerification } = ctx.luckysheetfile[index];
  ctx.dataVerificationDropDownList = false;
  if (!dataVerification) return;
  let row = ctx.visibledatarow[r];
  let row_pre = r === 0 ? 0 : ctx.visibledatarow[r - 1];
  let col = ctx.visibledatacolumn[c];
  let col_pre = c === 0 ? 0 : ctx.visibledatacolumn[c - 1];
  const d = getFlowdata(ctx);
  if (!d) return;
  const margeSet = mergeBorder(ctx, d, r, c);
  if (margeSet) {
    [row_pre, row] = margeSet.row;
    [col_pre, col] = margeSet.column;
  }
  const item = dataVerification[`${r}_${c}`];
  if (!item) return;

  // 单元格数据验证 类型是 复选
  if (clickMode && item.type === "checkbox") {
    checkboxChange(ctx, r, c);
  }

  // 单元格数据验证 类型是 下拉列表
  if (item.type === "dropdown") {
    dropDownBtn.style.display = "block";
    dropDownBtn.style.maxWidth = `${col - col_pre}px`;
    dropDownBtn.style.maxHeight = `${row - row_pre}px`;
    dropDownBtn.style.left = `${col - 20}px`;
    dropDownBtn.style.top = `${row_pre + (row - row_pre - 20) / 2 - 2}px`;
  }

  // 提示语
  if (item.hintShow) {
    let hintText = "";
    const { lang } = ctx;
    if (lang === "en") {
      hintText = '<span style="color:#f5a623;">Hint: </span>';
    } else if (lang === "zh" || lang === "zh-CN") {
      hintText = '<span style="color:#f5a623;">提示：</span>';
    } else if (lang === "zh-TW") {
      hintText = '<span style="color:#f5a623;">提示：</span>';
    } else if (lang === "es") {
      hintText = '<span style="color:#f5a623;">Consejos：</span>';
    }
    hintText += getHintText(ctx, item);
    showHintBox.innerHTML = hintText;
    showHintBox.style.display = "block";
    showHintBox.style.left = `${col_pre}px`;
    showHintBox.style.top = `${row}px`;
  }

  // 数据验证未通过,失效提醒
  const cellValue = getCellValue(r, c, d);
  if (isRealNull(cellValue)) {
    return;
  }
  const validate = validateCellData(ctx, item, cellValue);
  if (!validate) {
    let failureText = "";
    const { lang } = ctx;
    if (lang === "en") {
      failureText = '<span style="color:#f72626;">Failure: </span>';
    } else if (lang === "zh" || lang === "zh-CN") {
      failureText = '<span style="color:#f72626;">失效：</span>';
    } else if (lang === "zh-TW") {
      failureText = '<span style="color:#f72626;">失效：</span>';
    } else if (lang === "es") {
      failureText = '<span style="color:#f72626;">Caducidad: </span>';
    }
    failureText += getFailureText(ctx, item);
    showHintBox.innerHTML = failureText;
    showHintBox.style.display = "block";
    showHintBox.style.left = `${col_pre}px`;
    showHintBox.style.top = `${row}px`;
  }
}

// 设置下拉列表的值
export function setDropcownValue(ctx: Context, value: string, arr: any) {
  if (!ctx.luckysheet_select_save) return;
  const d = getFlowdata(ctx);
  if (!d) return;
  const last =
    ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
  const rowIndex = last.row_focus;
  const colIndex = last.column_focus;
  if (rowIndex == null || colIndex == null) return;
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  const item =
    ctx.luckysheetfile[index].dataVerification[`${rowIndex}_${colIndex}`];
  if (item.type2 === "true") {
    value = item.value1
      .split(",")
      .filter((v: any) => arr.indexOf(v) >= 0)
      .join(",");
  } else {
    ctx.dataVerificationDropDownList = false;
  }
  setCellValue(ctx, rowIndex, colIndex, d, value);
}

// 输入数据验证
export function confirmMessage(
  ctx: Context,
  generalDialog: any,
  dataVerification: any
): boolean {
  const range = getRangeByTxt(
    ctx,
    ctx.dataVerification?.dataRegulation?.rangeTxt as string
  );
  if (range.length === 0) {
    ctx.warnDialog = generalDialog.noSeletionError;
    return false;
  }
  let str = range[range.length - 1].row[0];
  let edr = range[range.length - 1].row[1];
  let stc = range[range.length - 1].column[0];
  let edc = range[range.length - 1].column[1];
  const d = getFlowdata(ctx);
  if (!d) return false;
  if (str < 0) {
    str = 0;
  }
  if (edr > d.length - 1) {
    edr = d.length - 1;
  }
  if (stc < 0) {
    stc = 0;
  }
  if (edc > d[0].length - 1) {
    edc = d[0].length - 1;
  }
  const regulation = ctx.dataVerification!.dataRegulation!;
  const verifacationT = regulation?.type;
  const { value1, value2, type2 } = regulation;
  // 判断是不是数字
  const v1 = parseFloat(value1).toString() !== "NaN";
  const v2 = parseFloat(value2).toString() !== "NaN";
  if (verifacationT === "dropdown") {
    if (!value1) {
      ctx.warnDialog = dataVerification.tooltipInfo1;
    }
  } else if (verifacationT === "checkbox") {
    if (!value1 || !value2) {
      ctx.warnDialog = dataVerification.tooltipInfo2;
    }
  } else if (
    verifacationT === "number" ||
    verifacationT === "number_integer" ||
    verifacationT === "number_decimal"
  ) {
    if (!v1) {
      ctx.warnDialog = dataVerification.tooltipInfo3;
      return false;
    }
    if (type2 === "between" || type2 === "notBetween") {
      if (!v2) {
        ctx.warnDialog = dataVerification.tooltipInfo3;
        return false;
      }
      if (Number(value2) < Number(value1)) {
        ctx.warnDialog = dataVerification.tooltipInfo4;
        return false;
      }
    }
  } else if (verifacationT === "text_content") {
    if (!value1) {
      ctx.warnDialog = dataVerification.tooltipInfo5;
      return false;
    }
  } else if (verifacationT === "text_length") {
    if (!v1) {
      ctx.warnDialog = dataVerification.tooltipInfo3;
      return false;
    }
    if (!Number.isInteger(Number(value1)) || Number(value1) < 0) {
      ctx.warnDialog = dataVerification.textlengthInteger;
      return false;
    }
    if (type2 === "between" || type2 === "notBetween") {
      if (!v2) {
        ctx.warnDialog = dataVerification.tooltipInfo3;
        return false;
      }
      if (!Number.isInteger(Number(value2)) || Number(value2) < 0) {
        ctx.warnDialog = dataVerification.textlengthInteger;
        return false;
      }
      if (Number(value2) < Number(value1)) {
        ctx.warnDialog = dataVerification.tooltipInfo4;
        return false;
      }
    }
  } else if (verifacationT === "date") {
    if (!isdatetime(value1)) {
      ctx.warnDialog = dataVerification.tooltipInfo6;
      return false;
    }
    if (type2 === "between" || type2 === "notBetween") {
      if (!isdatetime(value2)) {
        ctx.warnDialog = dataVerification.tooltipInfo6;
        return false;
      }
      if (diff(value1, value2) > 0) {
        ctx.warnDialog = dataVerification.tooltipInfo7;
        return false;
      }
    }
  }
  return true;
}
