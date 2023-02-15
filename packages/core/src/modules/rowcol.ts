import _ from "lodash";
import { Context } from "../context";
import { Sheet } from "../types";
import { getSheetIndex } from "../utils";
import { getcellFormula } from "./cell";
import { functionStrChange } from "./formula";

const refreshLocalMergeData = (merge_new: Record<string, any>, file: Sheet) => {
  Object.entries(merge_new).forEach(([, v]) => {
    const { r, c, rs, cs } = v as {
      r: number;
      c: number;
      rs: number;
      cs: number;
    };

    for (let i = r; i < r + rs; i += 1) {
      for (let j = c; j < c + cs; j += 1) {
        if (file?.data?.[i]?.[j]) {
          file.data[i][j] = { ...file.data[i][j], mc: { r, c } };
        }
      }
    }

    if (file?.data?.[r]?.[c]) {
      file.data[r][c] = { ...file.data[r][c], mc: { r, c, rs, cs } };
    }
  });
};

/**
 * 增加行列
 * @param {string} type 行或列 ['row', 'column'] 之一
 * @param {number} index 插入的位置 index
 * @param {number} count 插入 多少 行（列）
 * @param {string} direction 哪个方向插入 ['lefttop','rightbottom'] 之一
 * @param {string | number} id 操作的 sheet 的 id
 * @returns
 */
export function insertRowCol(
  ctx: Context,
  op: {
    type: "row" | "column";
    index: number;
    count: number;
    direction: "lefttop" | "rightbottom";
    id: string;
  }
) {
  let { count, id } = op;
  const { type, index, direction } = op;
  id = id || ctx.currentSheetId;

  // if (
  //   type === "row" &&
  //   !checkProtectionAuthorityNormal(sheetId, "insertRows")
  // ) {
  //   return;
  // } else if (
  //   type === "column" &&
  //   !checkProtectionAuthorityNormal(sheetId, "insertColumns")
  // ) {
  //   return;
  // }

  const curOrder = getSheetIndex(ctx, id);
  if (curOrder == null) return;

  const file = ctx.luckysheetfile[curOrder];
  if (!file) return;

  const d = file.data;
  if (!d) return;

  if (type === "row" && d.length + count >= 10000) {
    throw new Error(
      "This action would increase the number of rows in the workbook above the limit of 10000."
    );
  }

  if (type === "column" && d[0] && d[0].length + count >= 1000) {
    throw new Error(
      "This action would increase the number of columns in the workbook above the limit of 1000."
    );
  }

  count = Math.floor(count);
  const cfg = file.config || {};

  // 合并单元格配置变动
  if (cfg.merge == null) {
    cfg.merge = {};
  }

  const merge_new: any = {};
  _.forEach(cfg.merge, (mc) => {
    const { r, c, rs, cs } = mc;

    if (type === "row") {
      if (index < r) {
        merge_new[`${r + count}_${c}`] = { r: r + count, c, rs, cs };
      } else if (index === r) {
        if (direction === "lefttop") {
          merge_new[`${r + count}_${c}`] = {
            r: r + count,
            c,
            rs,
            cs,
          };
        } else {
          merge_new[`${r}_${c}`] = { r, c, rs: rs + count, cs };
        }
      } else if (index < r + rs - 1) {
        merge_new[`${r}_${c}`] = { r, c, rs: rs + count, cs };
      } else if (index === r + rs - 1) {
        if (direction === "lefttop") {
          merge_new[`${r}_${c}`] = { r, c, rs: rs + count, cs };
        } else {
          merge_new[`${r}_${c}`] = { r, c, rs, cs };
        }
      } else {
        merge_new[`${r}_${c}`] = { r, c, rs, cs };
      }
    } else if (type === "column") {
      if (index < c) {
        merge_new[`${r}_${c + count}`] = {
          r,
          c: c + count,
          rs,
          cs,
        };
      } else if (index === c) {
        if (direction === "lefttop") {
          merge_new[`${r}_${c + count}`] = {
            r,
            c: c + count,
            rs,
            cs,
          };
        } else {
          merge_new[`${r}_${c}`] = { r, c, rs, cs: cs + count };
        }
      } else if (index < c + cs - 1) {
        merge_new[`${r}_${c}`] = { r, c, rs, cs: cs + count };
      } else if (index === c + cs - 1) {
        if (direction === "lefttop") {
          merge_new[`${r}_${c}`] = { r, c, rs, cs: cs + count };
        } else {
          merge_new[`${r}_${c}`] = { r, c, rs, cs };
        }
      } else {
        merge_new[`${r}_${c}`] = { r, c, rs, cs };
      }
    }
  });
  cfg.merge = merge_new;

  // 公式配置变动
  const newCalcChain = [];
  for (
    let SheetIndex = 0;
    SheetIndex < ctx.luckysheetfile.length;
    SheetIndex += 1
  ) {
    if (
      _.isNil(ctx.luckysheetfile[SheetIndex].calcChain) ||
      ctx.luckysheetfile.length === 0
    ) {
      continue;
    }
    const { calcChain } = ctx.luckysheetfile[SheetIndex];
    const { data } = ctx.luckysheetfile[SheetIndex];
    for (let i = 0; i < calcChain!.length; i += 1) {
      const calc: any = _.cloneDeep(calcChain![i]);
      const calc_r = calc.r;
      const calc_c = calc.c;
      const calc_i = calc.id;
      const calc_funcStr = getcellFormula(ctx, calc_r, calc_c, calc_i);

      if (type === "row" && SheetIndex === curOrder) {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "add",
          "row",
          direction,
          index,
          count
        )}`;

        if (d[calc_r]?.[calc_c]?.f === calc_funcStr) {
          d[calc_r]![calc_c]!.f = functionStr;
        }

        if (direction === "lefttop") {
          if (calc_r >= index) {
            calc.r += count;
          }
        } else if (direction === "rightbottom") {
          if (calc_r > index) {
            calc.r += count;
          }
        }

        newCalcChain.push(calc);
      } else if (type === "row") {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "add",
          "row",
          direction,
          index,
          count
        )}`;

        if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
          data![calc_r]![calc_c]!.f = functionStr;
        }
      } else if (type === "column" && SheetIndex === curOrder) {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "add",
          "col",
          direction,
          index,
          count
        )}`;

        if (d[calc_r]?.[calc_c]?.f === calc_funcStr) {
          d[calc_r]![calc_c]!.f = functionStr;
        }

        if (direction === "lefttop") {
          if (calc_c >= index) {
            calc.c += count;
          }
        } else if (direction === "rightbottom") {
          if (calc_c > index) {
            calc.c += count;
          }
        }

        newCalcChain.push(calc);
      } else if (type === "column") {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "add",
          "col",
          direction,
          index,
          count
        )}`;

        if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
          data![calc_r]![calc_c]!.f = functionStr;
        }
      }
    }
  }

  // 筛选配置变动
  const { filter_select } = file;
  const { filter } = file;
  let newFilterObj: any = null;
  if (!_.isEmpty(filter_select) && filter_select != null) {
    newFilterObj = { filter_select: null, filter: null };

    let f_r1 = filter_select.row[0];
    let f_r2 = filter_select.row[1];
    let f_c1 = filter_select.column[0];
    let f_c2 = filter_select.column[1];

    if (type === "row") {
      if (f_r1 < index) {
        if (f_r2 === index && direction === "lefttop") {
          f_r2 += count;
        } else if (f_r2 > index) {
          f_r2 += count;
        }
      } else if (f_r1 === index) {
        if (direction === "lefttop") {
          f_r1 += count;
          f_r2 += count;
        } else if (direction === "rightbottom" && f_r2 > index) {
          f_r2 += count;
        }
      } else {
        f_r1 += count;
        f_r2 += count;
      }

      if (filter != null) {
        newFilterObj.filter = {};

        _.forEach(filter, (v, k) => {
          const f_rowhidden = filter[k].rowhidden;
          const f_rowhidden_new: any = {};
          _.forEach(f_rowhidden, (v1, nstr) => {
            const n = parseFloat(nstr);

            if (n < index) {
              f_rowhidden_new[n] = 0;
            } else if (n === index) {
              if (direction === "lefttop") {
                f_rowhidden_new[n + count] = 0;
              } else if (direction === "rightbottom") {
                f_rowhidden_new[n] = 0;
              }
            } else {
              f_rowhidden_new[n + count] = 0;
            }
          });
          newFilterObj.filter[k] = _.cloneDeep(filter[k]);
          newFilterObj.filter[k].rowhidden = f_rowhidden_new;
          newFilterObj.filter[k].str = f_r1;
          newFilterObj.filter[k].edr = f_r2;
        });
      }
    } else if (type === "column") {
      if (f_c1 < index) {
        if (f_c2 === index && direction === "lefttop") {
          f_c2 += count;
        } else if (f_c2 > index) {
          f_c2 += count;
        }
      } else if (f_c1 === index) {
        if (direction === "lefttop") {
          f_c1 += count;
          f_c2 += count;
        } else if (direction === "rightbottom" && f_c2 > index) {
          f_c2 += count;
        }
      } else {
        f_c1 += count;
        f_c2 += count;
      }

      if (filter != null) {
        newFilterObj.filter = {};

        _.forEach(filter, (v, k) => {
          let f_cindex = filter[k].cindex;

          if (f_cindex === index && direction === "lefttop") {
            f_cindex += count;
          } else if (f_cindex > index) {
            f_cindex += count;
          }

          newFilterObj.filter[f_cindex - f_c1] = _.cloneDeep(filter[k]);
          newFilterObj.filter[f_cindex - f_c1].cindex = f_cindex;
          newFilterObj.filter[f_cindex - f_c1].stc = f_c1;
          newFilterObj.filter[f_cindex - f_c1].edc = f_c2;
        });
      }
    }

    newFilterObj.filter_select = { row: [f_r1, f_r2], column: [f_c1, f_c2] };
  }

  if (newFilterObj != null && newFilterObj.filter != null) {
    if (cfg.rowhidden == null) {
      cfg.rowhidden = {};
    }

    _.forEach(newFilterObj.filter, (v, k) => {
      const f_rowhidden = newFilterObj.filter[k].rowhidden;
      _.forEach(f_rowhidden, (v1, n) => {
        cfg.rowhidden![n] = 0;
      });
    });
  }

  // 条件格式配置变动
  const CFarr = file.luckysheet_conditionformat_save;
  const newCFarr = [];
  if (CFarr != null && CFarr.length > 0) {
    for (let i = 0; i < CFarr.length; i += 1) {
      const cf_range = CFarr[i].cellrange;
      const cf_new_range = [];

      for (let j = 0; j < cf_range.length; j += 1) {
        let CFr1 = cf_range[j].row[0];
        let CFr2 = cf_range[j].row[1];
        let CFc1 = cf_range[j].column[0];
        let CFc2 = cf_range[j].column[1];

        if (type === "row") {
          if (CFr1 < index) {
            if (CFr2 === index && direction === "lefttop") {
              CFr2 += count;
            } else if (CFr2 > index) {
              CFr2 += count;
            }
          } else if (CFr1 === index) {
            if (direction === "lefttop") {
              CFr1 += count;
              CFr2 += count;
            } else if (direction === "rightbottom" && CFr2 > index) {
              CFr2 += count;
            }
          } else {
            CFr1 += count;
            CFr2 += count;
          }
        } else if (type === "column") {
          if (CFc1 < index) {
            if (CFc2 === index && direction === "lefttop") {
              CFc2 += count;
            } else if (CFc2 > index) {
              CFc2 += count;
            }
          } else if (CFc1 === index) {
            if (direction === "lefttop") {
              CFc1 += count;
              CFc2 += count;
            } else if (direction === "rightbottom" && CFc2 > index) {
              CFc2 += count;
            }
          } else {
            CFc1 += count;
            CFc2 += count;
          }
        }

        cf_new_range.push({ row: [CFr1, CFr2], column: [CFc1, CFc2] });
      }

      const cf = _.clone(CFarr[i]);
      cf.cellrange = cf_new_range;

      newCFarr.push(cf);
    }
  }

  // 交替颜色配置变动
  const AFarr = file.luckysheet_alternateformat_save;
  const newAFarr = [];
  if (AFarr != null && AFarr.length > 0) {
    for (let i = 0; i < AFarr.length; i += 1) {
      let AFr1 = AFarr[i].cellrange.row[0];
      let AFr2 = AFarr[i].cellrange.row[1];
      let AFc1 = AFarr[i].cellrange.column[0];
      let AFc2 = AFarr[i].cellrange.column[1];

      const af = _.clone(AFarr[i]);

      if (type === "row") {
        if (AFr1 < index) {
          if (AFr2 === index && direction === "lefttop") {
            AFr2 += count;
          } else if (AFr2 > index) {
            AFr2 += count;
          }
        } else if (AFr1 === index) {
          if (direction === "lefttop") {
            AFr1 += count;
            AFr2 += count;
          } else if (direction === "rightbottom" && AFr2 > index) {
            AFr2 += count;
          }
        } else {
          AFr1 += count;
          AFr2 += count;
        }
      } else if (type === "column") {
        if (AFc1 < index) {
          if (AFc2 === index && direction === "lefttop") {
            AFc2 += count;
          } else if (AFc2 > index) {
            AFc2 += count;
          }
        } else if (AFc1 === index) {
          if (direction === "lefttop") {
            AFc1 += count;
            AFc2 += count;
          } else if (direction === "rightbottom" && AFc2 > index) {
            AFc2 += count;
          }
        } else {
          AFc1 += count;
          AFc2 += count;
        }
      }

      af.cellrange = { row: [AFr1, AFr2], column: [AFc1, AFc2] };

      newAFarr.push(af);
    }
  }

  // 冻结配置变动
  const { frozen } = file;
  if (frozen) {
    const normalizedIndex = direction === "lefttop" ? index - 1 : index;
    if (
      type === "row" &&
      (frozen.type === "rangeRow" || frozen.type === "rangeBoth")
    ) {
      if ((frozen.range?.row_focus ?? -1) > normalizedIndex) {
        frozen.range!.row_focus += count;
      }
    }
    if (
      type === "column" &&
      (frozen.type === "rangeColumn" || frozen.type === "rangeBoth")
    ) {
      if ((frozen.range?.column_focus ?? -1) > normalizedIndex) {
        frozen.range!.column_focus += count;
      }
    }
  }

  // 数据验证配置变动
  const { dataVerification } = file;
  const newDataVerification: any = {};
  if (dataVerification != null) {
    _.forEach(dataVerification, (v, key) => {
      const r = Number(key.split("_")[0]);
      const c = Number(key.split("_")[1]);
      const item = dataVerification[key];

      if (type === "row") {
        if (index < r) {
          newDataVerification[`${r + count}_${c}`] = item;
        } else if (index === r) {
          if (direction === "lefttop") {
            newDataVerification[`${r + count}_${c}`] = item;

            for (let i = 0; i < count; i += 1) {
              newDataVerification[`${r + i}_${c}`] = item;
            }
          } else {
            newDataVerification[`${r}_${c}`] = item;

            for (let i = 0; i < count; i += 1) {
              newDataVerification[`${r + i + 1}_${c}`] = item;
            }
          }
        } else {
          newDataVerification[`${r}_${c}`] = item;
        }
      } else if (type === "column") {
        if (index < c) {
          newDataVerification[`${r}_${c + count}`] = item;
        } else if (index === c) {
          if (direction === "lefttop") {
            newDataVerification[`${r}_${c + count}`] = item;

            for (let i = 0; i < count; i += 1) {
              newDataVerification[`${r}_${c + i}`] = item;
            }
          } else {
            newDataVerification[`${r}_${c}`] = item;

            for (let i = 0; i < count; i += 1) {
              newDataVerification[`${r}_${c + i + 1}`] = item;
            }
          }
        } else {
          newDataVerification[`${r}_${c}`] = item;
        }
      }
    });
  }

  // 超链接配置变动
  const { hyperlink } = file;
  const newHyperlink: any = {};
  if (hyperlink != null) {
    _.forEach(hyperlink, (v, key) => {
      const r = Number(key.split("_")[0]);
      const c = Number(key.split("_")[1]);
      const item = hyperlink[key];

      if (type === "row") {
        if (index < r) {
          newHyperlink[`${r + count}_${c}`] = item;
        } else if (index === r) {
          if (direction === "lefttop") {
            newHyperlink[`${r + count}_${c}`] = item;
          } else {
            newHyperlink[`${r}_${c}`] = item;
          }
        } else {
          newHyperlink[`${r}_${c}`] = item;
        }
      } else if (type === "column") {
        if (index < c) {
          newHyperlink[`${r}_${c + count}`] = item;
        } else if (index === c) {
          if (direction === "lefttop") {
            newHyperlink[`${r}_${c + count}`] = item;
          } else {
            newHyperlink[`${r}_${c}`] = item;
          }
        } else {
          newHyperlink[`${r}_${c}`] = item;
        }
      }
    });
  }

  let type1;
  if (type === "row") {
    type1 = "r";

    // 行高配置变动
    if (cfg.rowlen != null) {
      const rowlen_new: any = {};

      _.forEach(cfg.rowlen, (v, rstr) => {
        const r = parseFloat(rstr);

        if (r < index) {
          rowlen_new[r] = cfg.rowlen![r];
        } else if (r === index) {
          if (direction === "lefttop") {
            rowlen_new[r + count] = cfg.rowlen![r];
          } else if (direction === "rightbottom") {
            rowlen_new[r] = cfg.rowlen![r];
          }
        } else {
          rowlen_new[r + count] = cfg.rowlen![r];
        }
      });

      cfg.rowlen = rowlen_new;
    }

    // 隐藏行配置变动
    if (cfg.rowhidden != null) {
      const rowhidden_new: any = {};

      _.forEach(cfg.rowhidden, (v, rstr) => {
        const r = parseFloat(rstr);

        if (r < index) {
          rowhidden_new[r] = cfg.rowhidden![r];
        } else if (r === index) {
          if (direction === "lefttop") {
            rowhidden_new[r + count] = cfg.rowhidden![r];
          } else if (direction === "rightbottom") {
            rowhidden_new[r] = cfg.rowhidden![r];
          }
        } else {
          rowhidden_new[r + count] = cfg.rowhidden![r];
        }
      });

      cfg.rowhidden = rowhidden_new;
    }

    // 空行模板
    const row = [];
    const curRow = [...d][index];
    for (let c = 0; c < d[0].length; c += 1) {
      const cell = curRow[c];
      let templateCell = null;
      if (cell != null) {
        templateCell = { ...cell, v: "", m: "" };
        if (!d?.[index + 1]?.[c]?.mc) {
          templateCell.mc = undefined;
        }
        delete templateCell.ps;
        delete templateCell.f;
      }
      row.push(templateCell);
    }
    const cellBorderConfig = [];
    // 边框
    if (cfg.borderInfo && cfg.borderInfo.length > 0) {
      const borderInfo = [];

      for (let i = 0; i < cfg.borderInfo.length; i += 1) {
        const { rangeType } = cfg.borderInfo[i];

        if (rangeType === "range") {
          const borderRange = cfg.borderInfo[i].range;

          const emptyRange = [];

          for (let j = 0; j < borderRange.length; j += 1) {
            let bd_r1 = borderRange[j].row[0];
            let bd_r2 = borderRange[j].row[1];

            if (direction === "lefttop") {
              if (index <= bd_r1) {
                bd_r1 += count;
                bd_r2 += count;
              } else if (index <= bd_r2) {
                bd_r2 += count;
              }
            } else {
              if (index < bd_r1) {
                bd_r1 += count;
                bd_r2 += count;
              } else if (index < bd_r2) {
                bd_r2 += count;
              }
            }

            if (bd_r2 >= bd_r1) {
              emptyRange.push({
                row: [bd_r1, bd_r2],
                column: borderRange[j].column,
              });
            }
          }

          if (emptyRange.length > 0) {
            const bd_obj = {
              rangeType: "range",
              borderType: cfg.borderInfo[i].borderType,
              style: cfg.borderInfo[i].style,
              color: cfg.borderInfo[i].color,
              range: emptyRange,
            };

            borderInfo.push(bd_obj);
          }
        } else if (rangeType === "cell") {
          let { row_index } = cfg.borderInfo[i].value;
          // 位置相同标识边框相关 先缓存
          if (row_index === index) {
            cellBorderConfig.push(
              JSON.parse(JSON.stringify(cfg.borderInfo[i]))
            );
          }

          if (direction === "lefttop") {
            if (index <= row_index) {
              row_index += count;
            }
          } else {
            if (index < row_index) {
              row_index += count;
            }
          }

          cfg.borderInfo[i].value.row_index = row_index;
          borderInfo.push(cfg.borderInfo[i]);
        }
      }

      cfg.borderInfo = borderInfo;
    }

    const arr = [];
    for (let r = 0; r < count; r += 1) {
      arr.push(JSON.stringify(row));
      // 同步拷贝 type 为 cell 类型的边框
      if (cellBorderConfig.length) {
        const cellBorderConfigCopy = _.cloneDeep(cellBorderConfig);
        cellBorderConfigCopy.forEach((item) => {
          if (direction === "rightbottom") {
            // 向下插入时 基于模板行位置直接递增即可
            item.value.row_index += r + 1;
          } else if (direction === "lefttop") {
            // 向上插入时 目标行移动到后面 新增n行到前面 对于新增的行来说 也是递增，不过是从0开始
            item.value.row_index += r;
          }
        });
        cfg.borderInfo?.push(...cellBorderConfigCopy);
      }
    }

    if (direction === "lefttop") {
      if (index === 0) {
        new Function("d", `return d.unshift(${arr.join(",")})`)(d);
      } else {
        new Function("d", `return d.splice(${index}, 0, ${arr.join(",")})`)(d);
      }
    } else {
      new Function("d", `return d.splice(${index + 1}, 0, ${arr.join(",")})`)(
        d
      );
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type1 = "c";

    // 行高配置变动
    if (cfg.columnlen != null) {
      const columnlen_new: any = {};

      _.forEach(cfg.columnlen, (v, cstr) => {
        const c = parseFloat(cstr);

        if (c < index) {
          columnlen_new[c] = cfg.columnlen![c];
        } else if (c === index) {
          if (direction === "lefttop") {
            columnlen_new[c + count] = cfg.columnlen![c];
          } else if (direction === "rightbottom") {
            columnlen_new[c] = cfg.columnlen![c];
          }
        } else {
          columnlen_new[c + count] = cfg.columnlen![c];
        }
      });

      cfg.columnlen = columnlen_new;
    }

    // 隐藏列配置变动
    if (cfg.colhidden != null) {
      const colhidden_new: any = {};

      _.forEach(cfg.colhidden, (v, cstr) => {
        const c = parseFloat(cstr);

        if (c < index) {
          colhidden_new[c] = cfg.colhidden![c];
        } else if (c === index) {
          if (direction === "lefttop") {
            colhidden_new[c + count] = cfg.colhidden![c];
          } else if (direction === "rightbottom") {
            colhidden_new[c] = cfg.colhidden![c];
          }
        } else {
          colhidden_new[c + count] = cfg.colhidden![c];
        }
      });

      cfg.colhidden = colhidden_new;
    }

    // 空列模板
    const col = [];
    const curd = [...d];
    for (let r = 0; r < d.length; r += 1) {
      const cell = curd[r][index];
      let templateCell = null;
      if (cell != null) {
        templateCell = { ...cell, v: "", m: "" };
        if (!curd?.[r]?.[index + 1]?.mc) {
          templateCell.mc = undefined;
        }
        delete templateCell.ps;
        delete templateCell.f;
      }
      col.push(templateCell);
    }
    const cellBorderConfig = [];
    // 边框
    if (cfg.borderInfo && cfg.borderInfo.length > 0) {
      const borderInfo = [];

      for (let i = 0; i < cfg.borderInfo.length; i += 1) {
        const { rangeType } = cfg.borderInfo[i];

        if (rangeType === "range") {
          const borderRange = cfg.borderInfo[i].range;

          const emptyRange = [];

          for (let j = 0; j < borderRange.length; j += 1) {
            let bd_c1 = borderRange[j].column[0];
            let bd_c2 = borderRange[j].column[1];

            if (direction === "lefttop") {
              if (index <= bd_c1) {
                bd_c1 += count;
                bd_c2 += count;
              } else if (index <= bd_c2) {
                bd_c2 += count;
              }
            } else {
              if (index < bd_c1) {
                bd_c1 += count;
                bd_c2 += count;
              } else if (index < bd_c2) {
                bd_c2 += count;
              }
            }

            if (bd_c2 >= bd_c1) {
              emptyRange.push({
                row: borderRange[j].row,
                column: [bd_c1, bd_c2],
              });
            }
          }

          if (emptyRange.length > 0) {
            const bd_obj = {
              rangeType: "range",
              borderType: cfg.borderInfo[i].borderType,
              style: cfg.borderInfo[i].style,
              color: cfg.borderInfo[i].color,
              range: emptyRange,
            };

            borderInfo.push(bd_obj);
          }
        } else if (rangeType === "cell") {
          let { col_index } = cfg.borderInfo[i].value;
          // 位置相同标识边框相关 先缓存
          if (col_index === index) {
            cellBorderConfig.push(
              JSON.parse(JSON.stringify(cfg.borderInfo[i]))
            );
          }

          if (direction === "lefttop") {
            if (index <= col_index) {
              col_index += count;
            }
          } else {
            if (index < col_index) {
              col_index += count;
            }
          }

          cfg.borderInfo[i].value.col_index = col_index;
          borderInfo.push(cfg.borderInfo[i]);
        }
      }

      cfg.borderInfo = borderInfo;
    }

    // 处理相关的 type 为 cell 类型的边框
    if (cellBorderConfig.length) {
      for (let i = 0; i < count; i += 1) {
        const cellBorderConfigCopy = _.cloneDeep(cellBorderConfig);
        cellBorderConfigCopy.forEach((item) => {
          if (direction === "rightbottom") {
            // 向右插入时 基于模板列位置直接递增即可
            item.value.col_index += i + 1;
          } else if (direction === "lefttop") {
            // 向左插入时 目标列移动到后面 新增n列到前面 对于新增的列来说 也是递增，不过是从0开始
            item.value.col_index += i;
          }
        });
        cfg.borderInfo?.push(...cellBorderConfigCopy);
      }
    }

    for (let r = 0; r < d.length; r += 1) {
      const row = d[r];

      for (let i = 0; i < count; i += 1) {
        if (direction === "lefttop") {
          if (index === 0) {
            row.unshift(col[r]);
          } else {
            row.splice(index, 0, col[r]);
          }
        } else {
          row.splice(index + 1, 0, col[r]);
        }
      }
    }
  }

  // 修改当前sheet页时刷新
  file.data = d;
  file.config = cfg;
  file.calcChain = newCalcChain;
  if (newFilterObj != null) {
    file.filter = newFilterObj.filter;
    file.filter_select = newFilterObj.filter_select;
  }
  file.luckysheet_conditionformat_save = newCFarr;
  file.luckysheet_alternateformat_save = newAFarr;
  file.dataVerification = newDataVerification;
  file.hyperlink = newHyperlink;
  if (file.id === ctx.currentSheetId) {
    ctx.config = cfg;
    // jfrefreshgrid_adRC(
    //   d,
    //   cfg,
    //   "addRC",
    //   {
    //     index,
    //     len: value,
    //     direction,
    //     rc: type1,
    //     restore: false,
    //   },
    //   newCalcChain,
    //   newFilterObj,
    //   newCFarr,
    //   newAFarr,
    //   newFreezen,
    //   newDataVerification,
    //   newHyperlink
    // );
  }

  let range = null;
  if (type === "row") {
    if (direction === "lefttop") {
      range = [
        { row: [index, index + count - 1], column: [0, d[0].length - 1] },
      ];
    } else {
      range = [
        { row: [index + 1, index + count], column: [0, d[0].length - 1] },
      ];
    }
  } else {
    if (direction === "lefttop") {
      range = [{ row: [0, d.length - 1], column: [index, index + count - 1] }];
    } else {
      range = [{ row: [0, d.length - 1], column: [index + 1, index + count] }];
    }
  }

  file.luckysheet_select_save = range;
  if (file.id === ctx.currentSheetId) {
    ctx.luckysheet_select_save = range;
    // selectHightlightShow();
  }

  refreshLocalMergeData(merge_new, file);

  // if (type === "row") {
  //   const scrollLeft = $("#luckysheet-cell-main").scrollLeft();
  //   const scrollTop = $("#luckysheet-cell-main").scrollTop();
  //   const winH = $("#luckysheet-cell-main").height();
  //   const winW = $("#luckysheet-cell-main").width();

  //   const row = ctx.visibledatarow[range[0].row[1]];
  //   const row_pre =
  //     range[0].row[0] - 1 === -1 ? 0 : ctx.visibledatarow[range[0].row[0] - 1];

  //   if (row - scrollTop - winH + 20 > 0) {
  //     $("#luckysheet-scrollbar-y").scrollTop(row - winH + 20);
  //   } else if (row_pre - scrollTop - 20 < 0) {
  //     $("#luckysheet-scrollbar-y").scrollTop(row_pre - 20);
  //   }

  //   if (value > 30) {
  //     $("#luckysheet-row-count-show").hide();
  //   }
  // }
}

export function deleteRowCol(
  ctx: Context,
  op: {
    type: "row" | "column";
    start: number;
    end: number;
    id?: string;
  }
) {
  const { type } = op;
  let { start, end, id } = op;
  id = id || ctx.currentSheetId;

  // if (
  //   type == "row" &&
  //   !checkProtectionAuthorityNormal(sheetId, "deleteRows")
  // ) {
  //   return;
  // }
  // if (
  //   type == "column" &&
  //   !checkProtectionAuthorityNormal(sheetId, "deleteColumns")
  // ) {
  //   return;
  // }

  const curOrder = getSheetIndex(ctx, id);
  if (curOrder == null) return;

  const file = ctx.luckysheetfile[curOrder];
  if (!file) return;

  const d = file.data;
  if (!d) return;

  if (start < 0) {
    start = 0;
  }

  if (end < 0) {
    end = 0;
  }

  if (type === "row") {
    if (start > d.length - 1) {
      start = d.length - 1;
    }

    if (end > d.length - 1) {
      end = d.length - 1;
    }
  } else {
    if (start > d[0].length - 1) {
      start = d[0].length - 1;
    }

    if (end > d[0].length - 1) {
      end = d[0].length - 1;
    }
  }

  if (start > end) {
    return;
  }

  const slen = end - start + 1;
  const cfg = file.config || {};

  // 合并单元格配置变动
  if (cfg.merge == null) {
    cfg.merge = {};
  }

  const merge_new: any = {};
  _.forEach(cfg.merge, (mc) => {
    const { r } = mc;
    const { c } = mc;
    const { rs } = mc;
    const { cs } = mc;

    if (type === "row") {
      if (r < start) {
        if (r + rs - 1 < start) {
          merge_new[`${r}_${c}`] = { r, c, rs, cs };
        } else if (r + rs - 1 >= start && r + rs - 1 < end) {
          merge_new[`${r}_${c}`] = { r, c, rs: start - r, cs };
        } else if (r + rs - 1 >= end) {
          merge_new[`${r}_${c}`] = { r, c, rs: rs - slen, cs };
        }
      } else if (r >= start && r <= end) {
        if (r + rs - 1 > end) {
          merge_new[`${start}_${c}`] = {
            r: start,
            c,
            rs: r + rs - 1 - end,
            cs,
          };
        }
      } else if (r > end) {
        merge_new[`${r - slen}_${c}`] = { r: r - slen, c, rs, cs };
      }
    } else if (type === "column") {
      if (c < start) {
        if (c + cs - 1 < start) {
          merge_new[`${r}_${c}`] = { r, c, rs, cs };
        } else if (c + cs - 1 >= start && c + cs - 1 < end) {
          merge_new[`${r}_${c}`] = { r, c, rs, cs: start - c };
        } else if (c + cs - 1 >= end) {
          merge_new[`${r}_${c}`] = { r, c, rs, cs: cs - slen };
        }
      } else if (c >= start && c <= end) {
        if (c + cs - 1 > end) {
          merge_new[`${r}_${start}`] = {
            r,
            c: start,
            rs,
            cs: c + cs - 1 - end,
          };
        }
      } else if (c > end) {
        merge_new[`${r}_${c - slen}`] = { r, c: c - slen, rs, cs };
      }
    }
  });
  cfg.merge = merge_new;

  // 公式配置变动
  const newCalcChain = [];
  for (
    let SheetIndex = 0;
    SheetIndex < ctx.luckysheetfile.length;
    SheetIndex += 1
  ) {
    if (
      _.isNil(ctx.luckysheetfile[SheetIndex].calcChain) ||
      ctx.luckysheetfile.length === 0
    ) {
      continue;
    }
    const { calcChain } = ctx.luckysheetfile[SheetIndex];
    const { data } = ctx.luckysheetfile[SheetIndex];
    for (let i = 0; i < calcChain!.length; i += 1) {
      const calc: any = _.cloneDeep(calcChain![i]);
      const calc_r = calc.r;
      const calc_c = calc.c;
      const calc_i = calc.id;
      const calc_funcStr = getcellFormula(ctx, calc_r, calc_c, calc_i);

      if (type === "row" && SheetIndex === curOrder) {
        if (calc_r < start || calc_r > end) {
          const functionStr = `=${functionStrChange(
            calc_funcStr,
            "del",
            "row",
            null,
            start,
            slen
          )}`;

          if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
            data![calc_r]![calc_c]!.f = functionStr;
          }

          if (calc_r > end) {
            calc.r = calc_r - slen;
          }

          newCalcChain.push(calc);
        }
      } else if (type === "row") {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "del",
          "row",
          null,
          start,
          slen
        )}`;

        if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
          data![calc_r]![calc_c]!.f = functionStr;
        }
      } else if (type === "column" && SheetIndex === curOrder) {
        if (calc_c < start || calc_c > end) {
          const functionStr = `=${functionStrChange(
            calc_funcStr,
            "del",
            "col",
            null,
            start,
            slen
          )}`;

          if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
            data![calc_r]![calc_c]!.f = functionStr;
          }

          if (calc_c > end) {
            calc.c = calc_c - slen;
          }

          newCalcChain.push(calc);
        }
      } else if (type === "column") {
        const functionStr = `=${functionStrChange(
          calc_funcStr,
          "del",
          "col",
          null,
          start,
          slen
        )}`;

        if (data![calc_r]?.[calc_c]?.f === calc_funcStr) {
          data![calc_r]![calc_c]!.f = functionStr;
        }
      }
    }
  }

  // 筛选配置变动
  const { filter_select } = file;
  const { filter } = file;
  let newFilterObj: any = null;
  if (!_.isEmpty(filter_select) && filter_select != null) {
    newFilterObj = { filter_select: null, filter: null };

    let f_r1 = filter_select.row[0];
    let f_r2 = filter_select.row[1];
    let f_c1 = filter_select.column[0];
    let f_c2 = filter_select.column[1];

    if (type === "row") {
      if (f_r1 > end) {
        f_r1 -= slen;
        f_r2 -= slen;

        newFilterObj.filter_select = {
          row: [f_r1, f_r2],
          column: [f_c1, f_c2],
        };
      } else if (f_r1 < start) {
        if (f_r2 < start) {
        } else if (f_r2 <= end) {
          f_r2 = start - 1;
        } else {
          f_r2 -= slen;
        }

        newFilterObj.filter_select = {
          row: [f_r1, f_r2],
          column: [f_c1, f_c2],
        };
      }

      if (newFilterObj.filter_select != null && filter != null) {
        _.forEach(filter, (v, k) => {
          const f_rowhidden = filter[k].rowhidden;
          const f_rowhidden_new: any = {};
          _.forEach(f_rowhidden, (v1, nstr) => {
            const n = parseFloat(nstr);

            if (n < start) {
              f_rowhidden_new[n] = 0;
            } else if (n > end) {
              f_rowhidden_new[n - slen] = 0;
            }
          });

          if (!_.isEmpty(f_rowhidden_new)) {
            if (newFilterObj.filter == null) {
              newFilterObj.filter = {};
            }

            newFilterObj.filter[k] = _.cloneDeep(filter[k]);
            newFilterObj.filter[k].rowhidden = f_rowhidden_new;
            newFilterObj.filter[k].str = f_r1;
            newFilterObj.filter[k].edr = f_r2;
          }
        });
      }
    } else if (type === "column") {
      if (f_c1 > end) {
        f_c1 -= slen;
        f_c2 -= slen;

        newFilterObj.filter_select = {
          row: [f_r1, f_r2],
          column: [f_c1, f_c2],
        };
      } else if (f_c1 < start) {
        if (f_c2 < start) {
        } else if (f_c2 <= end) {
          f_c2 = start - 1;
        } else {
          f_c2 -= slen;
        }

        newFilterObj.filter_select = {
          row: [f_r1, f_r2],
          column: [f_c1, f_c2],
        };
      } else {
        if (f_c2 > end) {
          f_c1 = start;
          f_c2 -= slen;

          newFilterObj.filter_select = {
            row: [f_r1, f_r2],
            column: [f_c1, f_c2],
          };
        }
      }

      if (newFilterObj.filter_select != null && filter != null) {
        _.forEach(filter, (v, k) => {
          let f_cindex = filter[k].cindex;

          if (f_cindex < start) {
            if (newFilterObj.filter == null) {
              newFilterObj.filter = {};
            }

            newFilterObj.filter[f_cindex - f_c1] = _.cloneDeep(filter[k]);
            newFilterObj.filter[f_cindex - f_c1].edc = f_c2;
          } else if (f_cindex > end) {
            f_cindex -= slen;

            if (newFilterObj.filter == null) {
              newFilterObj.filter = {};
            }

            newFilterObj.filter[f_cindex - f_c1] = _.cloneDeep(filter[k]);
            newFilterObj.filter[f_cindex - f_c1].cindex = f_cindex;
            newFilterObj.filter[f_cindex - f_c1].stc = f_c1;
            newFilterObj.filter[f_cindex - f_c1].edc = f_c2;
          }
        });
      }
    }
  }

  if (newFilterObj != null && newFilterObj.filter != null) {
    if (cfg.rowhidden == null) {
      cfg.rowhidden = {};
    }

    _.forEach(newFilterObj.filter, (v, k) => {
      const f_rowhidden = newFilterObj.filter[k].rowhidden;
      _.forEach(f_rowhidden, (v1, n) => {
        cfg.rowhidden![n] = 0;
      });
    });
  }

  // 条件格式配置变动
  const CFarr = file.luckysheet_conditionformat_save;
  const newCFarr = [];
  if (CFarr != null && CFarr.length > 0) {
    for (let i = 0; i < CFarr.length; i += 1) {
      const cf_range = CFarr[i].cellrange;
      const cf_new_range = [];

      for (let j = 0; j < cf_range.length; j += 1) {
        let CFr1 = cf_range[j].row[0];
        let CFr2 = cf_range[j].row[1];
        let CFc1 = cf_range[j].column[0];
        let CFc2 = cf_range[j].column[1];

        if (type === "row") {
          if (!(CFr1 >= start && CFr2 <= end)) {
            if (CFr1 > end) {
              CFr1 -= slen;
              CFr2 -= slen;
            } else if (CFr1 < start) {
              if (CFr2 < start) {
              } else if (CFr2 <= end) {
                CFr2 = start - 1;
              } else {
                CFr2 -= slen;
              }
            } else {
              if (CFr2 > end) {
                CFr1 = start;
                CFr2 -= slen;
              }
            }

            cf_new_range.push({ row: [CFr1, CFr2], column: [CFc1, CFc2] });
          }
        } else if (type === "column") {
          if (!(CFc1 >= start && CFc2 <= end)) {
            if (CFc1 > end) {
              CFc1 -= slen;
              CFc2 -= slen;
            } else if (CFc1 < start) {
              if (CFc2 < start) {
              } else if (CFc2 <= end) {
                CFc2 = start - 1;
              } else {
                CFc2 -= slen;
              }
            } else {
              if (CFc2 > end) {
                CFc1 = start;
                CFc2 -= slen;
              }
            }

            cf_new_range.push({ row: [CFr1, CFr2], column: [CFc1, CFc2] });
          }
        }
      }

      if (cf_new_range.length > 0) {
        const cf = _.clone(CFarr[i]);
        cf.cellrange = cf_new_range;

        newCFarr.push(cf);
      }
    }
  }

  // 交替颜色配置变动
  const AFarr = file.luckysheet_alternateformat_save;
  const newAFarr = [];
  if (AFarr != null && AFarr.length > 0) {
    for (let i = 0; i < AFarr.length; i += 1) {
      let AFr1 = AFarr[i].cellrange.row[0];
      let AFr2 = AFarr[i].cellrange.row[1];
      let AFc1 = AFarr[i].cellrange.column[0];
      let AFc2 = AFarr[i].cellrange.column[1];

      if (type === "row") {
        if (!(AFr1 >= start && AFr2 <= end)) {
          const af = _.clone(AFarr[i]);

          if (AFr1 > end) {
            AFr1 -= slen;
            AFr2 -= slen;
          } else if (AFr1 < start) {
            if (AFr2 < start) {
            } else if (AFr2 <= end) {
              AFr2 = start - 1;
            } else {
              AFr2 -= slen;
            }
          } else {
            if (AFr2 > end) {
              AFr1 = start;
              AFr2 -= slen;
            }
          }

          af.cellrange = { row: [AFr1, AFr2], column: [AFc1, AFc2] };

          newAFarr.push(af);
        }
      } else if (type === "column") {
        if (!(AFc1 >= start && AFc2 <= end)) {
          const af = _.clone(AFarr[i]);

          if (AFc1 > end) {
            AFc1 -= slen;
            AFc2 -= slen;
          } else if (AFc1 < start) {
            if (AFc2 < start) {
            } else if (AFc2 <= end) {
              AFc2 = start - 1;
            } else {
              AFc2 -= slen;
            }
          } else {
            if (AFc2 > end) {
              AFc1 = start;
              AFc2 -= slen;
            }
          }

          af.cellrange = { row: [AFr1, AFr2], column: [AFc1, AFc2] };

          newAFarr.push(af);
        }
      }
    }
  }

  // 冻结配置变动
  const { frozen } = file;
  if (frozen) {
    if (
      type === "row" &&
      (frozen.type === "rangeRow" || frozen.type === "rangeBoth")
    ) {
      if ((frozen.range?.row_focus ?? -1) >= start) {
        frozen.range!.row_focus -=
          Math.min(end, frozen.range!.row_focus) - start + 1;
      }
    }
    if (
      type === "column" &&
      (frozen.type === "rangeColumn" || frozen.type === "rangeBoth")
    ) {
      if ((frozen.range?.column_focus ?? -1) >= start) {
        frozen.range!.column_focus -=
          Math.min(end, frozen.range!.column_focus) - start + 1;
      }
    }
  }

  // 数据验证配置变动
  const { dataVerification } = file;
  const newDataVerification: any = {};
  if (dataVerification != null) {
    _.forEach(dataVerification, (v, key) => {
      const r = Number(key.split("_")[0]);
      const c = Number(key.split("_")[1]);
      const item = dataVerification[key];

      if (type === "row") {
        if (r < start) {
          newDataVerification[`${r}_${c}`] = item;
        } else if (r > end) {
          newDataVerification[`${r - slen}_${c}`] = item;
        }
      } else if (type === "column") {
        if (c < start) {
          newDataVerification[`${r}_${c}`] = item;
        } else if (c > end) {
          newDataVerification[`${r}_${c - slen}`] = item;
        }
      }
    });
  }

  // 超链接配置变动
  const { hyperlink } = file;
  const newHyperlink: any = {};
  if (hyperlink != null) {
    _.forEach(hyperlink, (v, key) => {
      const r = Number(key.split("_")[0]);
      const c = Number(key.split("_")[1]);
      const item = hyperlink[key];

      if (type === "row") {
        if (r < start) {
          newHyperlink[`${r}_${c}`] = item;
        } else if (r > end) {
          newHyperlink[`${r - slen}_${c}`] = item;
        }
      } else if (type === "column") {
        if (c < start) {
          newHyperlink[`${r}_${c}`] = item;
        } else if (c > end) {
          newHyperlink[`${r}_${c - slen}`] = item;
        }
      }
    });
  }

  // 主逻辑
  let type1;
  if (type === "row") {
    type1 = "r";

    // 行高配置变动
    if (cfg.rowlen == null) {
      cfg.rowlen = {};
    }

    const rowlen_new: any = {};
    _.forEach(cfg.rowlen, (v, rstr) => {
      const r = parseFloat(rstr);
      if (r < start) {
        rowlen_new[r] = cfg.rowlen![r];
      } else if (r > end) {
        rowlen_new[r - slen] = cfg.rowlen![r];
      }
    });

    cfg.rowlen = rowlen_new;

    // 隐藏行配置变动
    if (cfg.rowhidden == null) {
      cfg.rowhidden = {};
    }

    const rowhidden_new: any = {};
    _.forEach(cfg.rowhidden, (v, rstr) => {
      const r = parseFloat(rstr);
      if (r < start) {
        rowhidden_new[r] = cfg.rowhidden![r];
      } else if (r > end) {
        rowhidden_new[r - slen] = cfg.rowhidden![r];
      }
    });

    cfg.rowhidden = rowhidden_new;

    // 边框配置变动
    if (cfg.borderInfo && cfg.borderInfo.length > 0) {
      const borderInfo = [];

      for (let i = 0; i < cfg.borderInfo.length; i += 1) {
        const { rangeType } = cfg.borderInfo[i];

        if (rangeType === "range") {
          const borderRange = cfg.borderInfo[i].range;

          const emptyRange = [];

          for (let j = 0; j < borderRange.length; j += 1) {
            let bd_r1 = borderRange[j].row[0];
            let bd_r2 = borderRange[j].row[1];

            for (let r = start; r <= end; r += 1) {
              if (r < borderRange[j].row[0]) {
                bd_r1 -= 1;
                bd_r2 -= 1;
              } else if (r <= borderRange[j].row[1]) {
                bd_r2 -= 1;
              }
            }

            if (bd_r2 >= bd_r1) {
              emptyRange.push({
                row: [bd_r1, bd_r2],
                column: borderRange[j].column,
              });
            }
          }

          if (emptyRange.length > 0) {
            const bd_obj = {
              rangeType: "range",
              borderType: cfg.borderInfo[i].borderType,
              style: cfg.borderInfo[i].style,
              color: cfg.borderInfo[i].color,
              range: emptyRange,
            };

            borderInfo.push(bd_obj);
          }
        } else if (rangeType === "cell") {
          const { row_index } = cfg.borderInfo[i].value;

          if (row_index < start) {
            borderInfo.push(cfg.borderInfo[i]);
          } else if (row_index > end) {
            cfg.borderInfo[i].value.row_index = row_index - (end - start + 1);
            borderInfo.push(cfg.borderInfo[i]);
          }
        }
      }

      cfg.borderInfo = borderInfo;
    }

    // 备注：该处理方式会在删除多行的时候会存在bug
    // 说明：删除多行后，会把同一个row空数组(引用类型)添加成为data多行的数据源，导致设置这些行数据时产生错误。
    // 空白行模板
    // let row = [];
    // for (let c = 0; c < d[0].length; c++) {
    //     row.push(null);
    // }

    // //删除选中行
    // d.splice(st, slen);

    // //删除多少行，增加多少行空白行
    // for (let r = 0; r < slen; r++) {
    //     d.push(row);
    // }

    // 删除选中行
    d.splice(start, slen);

    // 删除行后，调整行数
    file.row! -= slen;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type1 = "c";

    // 列宽配置变动
    if (cfg.columnlen == null) {
      cfg.columnlen = {};
    }

    const columnlen_new: any = {};
    _.forEach(cfg.columnlen, (v, cstr) => {
      const c = parseFloat(cstr);
      if (c < start) {
        columnlen_new[c] = cfg.columnlen![c];
      } else if (c > end) {
        columnlen_new[c - slen] = cfg.columnlen![c];
      }
    });

    cfg.columnlen = columnlen_new;

    // 隐藏列配置变动
    if (cfg.colhidden == null) {
      cfg.colhidden = {};
    }

    const colhidden_new: any = {};
    _.forEach(cfg.colhidden, (v, cstr) => {
      const c = parseFloat(cstr);
      if (c < start) {
        colhidden_new[c] = cfg.colhidden![c];
      } else if (c > end) {
        colhidden_new[c - slen] = cfg.colhidden![c];
      }
    });

    cfg.colhidden = colhidden_new;

    // 边框配置变动
    if (cfg.borderInfo && cfg.borderInfo.length > 0) {
      const borderInfo = [];

      for (let i = 0; i < cfg.borderInfo.length; i += 1) {
        const { rangeType } = cfg.borderInfo[i];

        if (rangeType === "range") {
          const borderRange = cfg.borderInfo[i].range;

          const emptyRange = [];

          for (let j = 0; j < borderRange.length; j += 1) {
            let bd_c1 = borderRange[j].column[0];
            let bd_c2 = borderRange[j].column[1];

            for (let c = start; c <= end; c += 1) {
              if (c < borderRange[j].column[0]) {
                bd_c1 -= 1;
                bd_c2 -= 1;
              } else if (c <= borderRange[j].column[1]) {
                bd_c2 -= 1;
              }
            }

            if (bd_c2 >= bd_c1) {
              emptyRange.push({
                row: borderRange[j].row,
                column: [bd_c1, bd_c2],
              });
            }
          }

          if (emptyRange.length > 0) {
            const bd_obj = {
              rangeType: "range",
              borderType: cfg.borderInfo[i].borderType,
              style: cfg.borderInfo[i].style,
              color: cfg.borderInfo[i].color,
              range: emptyRange,
            };

            borderInfo.push(bd_obj);
          }
        } else if (rangeType === "cell") {
          const { col_index } = cfg.borderInfo[i].value;

          if (col_index < start) {
            borderInfo.push(cfg.borderInfo[i]);
          } else if (col_index > end) {
            cfg.borderInfo[i].value.col_index = col_index - (end - start + 1);
            borderInfo.push(cfg.borderInfo[i]);
          }
        }
      }

      cfg.borderInfo = borderInfo;
    }

    for (let r = 0; r < d.length; r += 1) {
      // 删除选中列
      d[r].splice(start, slen);
    }

    // 删除列后，调整列数
    file.column! -= slen;
  }

  // 修改当前sheet页时刷新
  file.data = d;
  file.config = cfg;
  file.calcChain = newCalcChain;
  if (newFilterObj != null) {
    file.filter = newFilterObj.filter;
    file.filter_select = newFilterObj.filter_select;
  }
  file.luckysheet_conditionformat_save = newCFarr;
  file.luckysheet_alternateformat_save = newAFarr;
  file.dataVerification = newDataVerification;
  file.hyperlink = newHyperlink;

  refreshLocalMergeData(merge_new, file);

  if (file.id === ctx.currentSheetId) {
    ctx.config = cfg;
    // jfrefreshgrid_adRC(
    //   d,
    //   cfg,
    //   "delRC",
    //   { index: st, len: ed - st + 1, rc: type1 },
    //   newCalcChain,
    //   newFilterObj,
    //   newCFarr,
    //   newAFarr,
    //   newFreezen,
    //   newDataVerification,
    //   newHyperlink
    // );
  } else {
  }
}

// 计算表格行高数组
export function computeRowlenArr(ctx: Context, rowHeight: number, cfg: any) {
  const rowlenArr = [];
  let rh_height = 0;

  for (let i = 0; i < rowHeight; i += 1) {
    let rowlen = ctx.defaultrowlen;

    if (cfg.rowlen != null && cfg.rowlen[i] != null) {
      rowlen = cfg.rowlen[i];
    }

    if (cfg.rowhidden != null && cfg.rowhidden[i] != null) {
      rowlen = cfg.rowhidden[i];
      rowlenArr.push(rh_height);
      continue;
    } else {
      rh_height += rowlen + 1;
    }

    rowlenArr.push(rh_height); // 行的临时长度分布
  }

  return rowlenArr;
}

// 隐藏选中行列
export function hideSelected(ctx: Context, type: string) {
  if (!ctx.luckysheet_select_save || ctx.luckysheet_select_save.length > 1)
    return "noMulti";
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  // 隐藏行
  if (type === "row") {
    /* TODO: 工作表保护判断
    if (
      !checkProtectionAuthorityNormal(Store.currentSheetIndex, "formatRows")
    ) {
      return ;
    } */
    const rowhidden = ctx.config.rowhidden ?? {};
    const r1 = ctx.luckysheet_select_save[0].row[0];
    const r2 = ctx.luckysheet_select_save[0].row[1];
    const rowhiddenNumber = r2;
    for (let r = r1; r <= r2; r += 1) {
      rowhidden[r] = 0;
    }
    /* 保存撤销,luck中保存撤销用以下方式实现，而在本项目中不需要另外处理
      if(Store.clearjfundo){
        let redo = {};
        redo["type"] = "showHidRows";
        redo["sheetIndex"] = Store.currentSheetIndex;
        redo["config"] = $.extend(true, {}, Store.config);
        redo["curconfig"] = cfg;

        Store.jfundo.length  = 0;
        Store.jfredo.push(redo);
    } */
    ctx.config.rowhidden = rowhidden;
    const rowLen = ctx.luckysheetfile[index].data!.length;
    /**
     * 计算要隐藏的行是否是最后一列
     * 符合最后一列的条件：要隐藏的index===表格的长度-1 或者
     * 记录隐藏数组里面的数-1===要隐藏的index
     */
    const isEndRow =
      rowLen - 1 === rowhiddenNumber ||
      Object.keys(rowhidden).findIndex(
        (o) => parseInt(o, 10) - 1 === rowhiddenNumber
      ) >= 0;
    if (isEndRow) {
      ctx.luckysheet_select_save[0].row[0] -= 1;
      ctx.luckysheet_select_save[0].row[1] -= 1;
    } else {
      ctx.luckysheet_select_save[0].row[0] += 1;
      ctx.luckysheet_select_save[0].row[1] += 1;
    }
  } else if (type === "column") {
    // 隐藏列
    const colhidden = ctx.config.colhidden ?? {};
    const c1 = ctx.luckysheet_select_save[0].column[0];
    const c2 = ctx.luckysheet_select_save[0].column[1];
    const colhiddenNumber = c2;
    for (let c = c1; c <= c2; c += 1) {
      colhidden[c] = 0;
    }
    ctx.config.colhidden = colhidden;
    const columnLen = ctx.luckysheetfile[index].data![0].length;
    // 计算要隐藏的列是否是最后一列
    const isEndColumn =
      columnLen - 1 === colhiddenNumber ||
      Object.keys(colhidden).findIndex(
        (o) => parseInt(o, 10) - 1 === colhiddenNumber
      ) >= 0;
    if (isEndColumn) {
      ctx.luckysheet_select_save[0].column[0] -= 1;
      ctx.luckysheet_select_save[0].column[1] -= 1;
    } else {
      ctx.luckysheet_select_save[0].column[0] += 1;
      ctx.luckysheet_select_save[0].column[1] += 1;
    }
  }
  ctx.luckysheetfile[index].config = ctx.config;
  return "";
}

// 取消隐藏选中行列
export function showSelected(ctx: Context, type: string) {
  if (!ctx.luckysheet_select_save || ctx.luckysheet_select_save.length > 1)
    return "noMulti";
  const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
  // 取消隐藏行
  if (type === "row") {
    const rowhidden = ctx.config.rowhidden ?? {};
    const r1 = ctx.luckysheet_select_save[0].row[0];
    const r2 = ctx.luckysheet_select_save[0].row[1];
    for (let r = r1; r <= r2; r += 1) {
      delete rowhidden[r];
    }
    ctx.config.rowhidden = rowhidden;
  } else if (type === "column") {
    // 取消隐藏列
    const colhidden = ctx.config.colhidden ?? {};
    const c1 = ctx.luckysheet_select_save[0].column[0];
    const c2 = ctx.luckysheet_select_save[0].column[1];
    for (let c = c1; c <= c2; c += 1) {
      delete colhidden[c];
    }
    ctx.config.colhidden = colhidden;
  }
  ctx.luckysheetfile[index].config = ctx.config;
  return "";
}

// 判断当前选区是不是隐藏行列
export function isShowHidenCR(ctx: Context): boolean {
  if (
    !ctx.luckysheet_select_save ||
    (!ctx.config.colhidden && !ctx.config.rowhidden)
  )
    return false;
  // 如果当先选区处在隐藏行列的时候则不可编辑
  if (!!ctx.config.colhidden && _.size(ctx.config.colhidden) >= 1) {
    const ctxColumn = ctx.luckysheet_select_save[0].column[0];
    const isHidenColumn =
      Object.keys(ctx.config.colhidden).findIndex((o) => {
        return ctxColumn === parseInt(o, 10);
      }) >= 0;
    if (isHidenColumn) {
      return true;
    }
  }
  if (!!ctx.config.rowhidden && _.size(ctx.config.rowhidden) >= 1) {
    const ctxRow = ctx.luckysheet_select_save[0].row[0];
    const isHidenRow =
      Object.keys(ctx.config.rowhidden).findIndex((o) => {
        return ctxRow === parseInt(o, 10);
      }) >= 0;
    if (isHidenRow) {
      return true;
    }
  }
  return false;
}

// 计算键盘选区中要经过的隐藏行列的个数
export function hideCRCount(ctx: Context, type: string): number {
  let count = 1;
  if (!ctx.luckysheet_select_save) return 0;
  const section = ctx.luckysheet_select_save[0];
  const rowhidden = ctx.config.rowhidden ?? {};
  const colhidden = ctx.config.colhidden ?? {};
  if (type === "ArrowUp" || type === "ArrowDown") {
    const rowArr = Object.keys(rowhidden);
    if (type === "ArrowUp") {
      let row = section.row[0] - 1;
      const rowIndex = rowArr.indexOf(row.toString());
      for (let i = rowIndex; i >= 0; i -= 1) {
        if (parseInt(rowArr[i], 10) === row) {
          count += 1;
          row -= 1;
        } else {
          return count;
        }
      }
    } else {
      let row = section.row[0] + 1;
      const rowIndex = rowArr.indexOf(`${row}`);
      for (let i = rowIndex; i < rowArr.length; i += 1) {
        if (parseInt(rowArr[i], 10) === row) {
          count += 1;
          row += 1;
        } else {
          return count;
        }
      }
    }
  } else if (type === "ArrowLeft" || type === "ArrowRight") {
    const columnArr = Object.keys(colhidden);
    if (type === "ArrowLeft") {
      let column = section.column[0] - 1;
      const columnIndex = columnArr.indexOf(column.toString());
      for (let i = columnIndex; i >= 0; i -= 1) {
        if (parseInt(columnArr[i], 10) === column) {
          count += 1;
          column -= 1;
        } else {
          return count;
        }
      }
    } else {
      let column = section.column[0] + 1;
      const columnIndex = columnArr.indexOf(`${column}`);
      for (let i = columnIndex; i < columnArr.length; i += 1) {
        if (parseInt(columnArr[i], 10) === column) {
          count += 1;
          column += 1;
        } else {
          return count;
        }
      }
    }
  }

  return count;
}
