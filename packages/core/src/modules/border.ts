import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { CellMatrix } from "../types";
import { getSheetIndex } from "../utils";

// 获取表格边框数据计算值
export function getBorderInfoComputeRange(
  ctx: Context,
  dataset_row_st: number,
  dataset_row_ed: number,
  dataset_col_st: number,
  dataset_col_ed: number,
  sheetIndex?: string
) {
  const borderInfoCompute: any = {};
  const flowdata = getFlowdata(ctx);

  let cfg;
  let data: CellMatrix | null | undefined;
  if (!sheetIndex) {
    cfg = ctx.config;
    data = flowdata;
  } else {
    const index = getSheetIndex(ctx, sheetIndex);
    if (!_.isNil(index)) {
      cfg = ctx.luckysheetfile[index].config;
      data = ctx.luckysheetfile[index].data;
    } else {
      return borderInfoCompute;
    }
  }
  if (!data) return borderInfoCompute;

  const { borderInfo } = cfg;

  if (_.isEmpty(borderInfo)) return borderInfoCompute;

  for (let i = 0; i < borderInfo.length; i += 1) {
    const { rangeType } = borderInfo[i];

    if (rangeType === "range") {
      const { borderType } = borderInfo[i];
      const borderColor = borderInfo[i].color;
      const borderStyle = borderInfo[i].style;

      const borderRange = borderInfo[i].range;

      for (let j = 0; j < borderRange.length; j += 1) {
        let bd_r1 = borderRange[j].row[0];
        let bd_r2 = borderRange[j].row[1];
        let bd_c1 = borderRange[j].column[0];
        let bd_c2 = borderRange[j].column[1];

        if (bd_r1 < dataset_row_st) {
          bd_r1 = dataset_row_st;
        }

        if (bd_r2 > dataset_row_ed) {
          bd_r2 = dataset_row_ed;
        }

        if (bd_c1 < dataset_col_st) {
          bd_c1 = dataset_col_st;
        }

        if (bd_c2 > dataset_col_ed) {
          bd_c2 = dataset_col_ed;
        }

        if (borderType === "border-left") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            if (borderInfoCompute[`${bd_r}_${bd_c1}`] === undefined) {
              borderInfoCompute[`${bd_r}_${bd_c1}`] = {};
            }

            borderInfoCompute[`${bd_r}_${bd_c1}`].l = {
              color: borderColor,
              style: borderStyle,
            };

            const bd_c_left = bd_c1 - 1;

            if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
              if (!_.isNil(data[bd_r]?.[bd_c_left]?.mc)) {
                const cell_left = data[bd_r][bd_c_left];

                const mc = cfg.merge[`${cell_left?.mc?.r}_${cell_left?.mc?.c}`];

                if (mc.c + mc.cs - 1 === bd_c_left) {
                  borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                  color: borderColor,
                  style: borderStyle,
                };
              }
            }

            const mc = cfg.merge || {};
            Object.keys(mc).forEach((key) => {
              const { c, r, cs, rs } = mc[key];
              if (
                bd_c1 <= c + cs - 1 &&
                bd_c1 > c &&
                bd_r >= r &&
                bd_r <= r + rs - 1
              ) {
                borderInfoCompute[`${bd_r}_${bd_c1}`].l = null;
              }
            });
          }
        } else if (borderType === "border-right") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            if (borderInfoCompute[`${bd_r}_${bd_c2}`] === undefined) {
              borderInfoCompute[`${bd_r}_${bd_c2}`] = {};
            }

            borderInfoCompute[`${bd_r}_${bd_c2}`].r = {
              color: borderColor,
              style: borderStyle,
            };

            const bd_c_right = bd_c2 + 1;

            if (
              bd_c_right < data[0].length &&
              borderInfoCompute[`${bd_r}_${bd_c_right}`]
            ) {
              if (!_.isNil(data[bd_r]?.[bd_c_right]?.mc)) {
                const cell_right = data[bd_r][bd_c_right];

                const mc =
                  cfg.merge[`${cell_right?.mc?.r}_${cell_right?.mc?.c}`];

                if (mc.c === bd_c_right) {
                  borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                  color: borderColor,
                  style: borderStyle,
                };
              }
            }
            const mc = cfg.merge || {};
            Object.keys(mc).forEach((key) => {
              const { c, r, cs, rs } = mc[key];
              if (
                bd_c2 < c + cs - 1 &&
                bd_c2 >= c &&
                bd_r >= r &&
                bd_r <= r + rs - 1
              ) {
                borderInfoCompute[`${bd_r}_${bd_c2}`].r = null;
              }
            });
          }
        } else if (borderType === "border-top") {
          if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r1])) {
            continue;
          }

          for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
            if (borderInfoCompute[`${bd_r1}_${bd_c}`] === undefined) {
              borderInfoCompute[`${bd_r1}_${bd_c}`] = {};
            }

            borderInfoCompute[`${bd_r1}_${bd_c}`].t = {
              color: borderColor,
              style: borderStyle,
            };

            const bd_r_top = bd_r1 - 1;

            if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
              if (!_.isNil(data[bd_r_top]?.[bd_c]?.mc)) {
                const cell_top = data[bd_r_top][bd_c];

                const mc = cfg.merge[`${cell_top?.mc?.r}_${cell_top?.mc?.c}`];

                if (mc.r + mc.rs - 1 === bd_r_top) {
                  borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                  color: borderColor,
                  style: borderStyle,
                };
              }
            }

            const mc = cfg.merge || {};
            Object.keys(mc).forEach((key) => {
              const { c, r, cs, rs } = mc[key];
              if (
                bd_r1 <= r + rs - 1 &&
                bd_r1 > r &&
                bd_c >= c &&
                bd_c <= c + cs - 1
              ) {
                borderInfoCompute[`${bd_r1}_${bd_c}`].t = null;
              }
            });
          }
        } else if (borderType === "border-bottom") {
          if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r2])) {
            continue;
          }

          for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
            if (borderInfoCompute[`${bd_r2}_${bd_c}`] === undefined) {
              borderInfoCompute[`${bd_r2}_${bd_c}`] = {};
            }

            borderInfoCompute[`${bd_r2}_${bd_c}`].b = {
              color: borderColor,
              style: borderStyle,
            };

            const bd_r_bottom = bd_r2 + 1;

            if (
              bd_r_bottom < data.length &&
              borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
            ) {
              if (!_.isNil(data[bd_r_bottom]?.[bd_c]?.mc)) {
                const cell_bottom = data[bd_r_bottom][bd_c];

                const mc =
                  cfg.merge[`${cell_bottom?.mc?.r}_${cell_bottom?.mc?.c}`];

                if (mc.r === bd_r_bottom) {
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                  color: borderColor,
                  style: borderStyle,
                };
              }
            }

            const mc = cfg.merge || {};
            Object.keys(mc).forEach((key) => {
              const { c, r, cs, rs } = mc[key];
              if (
                bd_r2 < r + rs - 1 &&
                bd_r2 >= r &&
                bd_c >= c &&
                bd_c <= c + cs - 1
              ) {
                borderInfoCompute[`${bd_r2}_${bd_c}`].b = null;
              }
            });
          }
        } else if (borderType === "border-all") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                const cell = data[bd_r][bd_c];

                const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                if (mc.r === bd_r) {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }

                if (mc.r + mc.rs - 1 === bd_r) {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }

                if (mc.c === bd_c) {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }

                if (mc.c + mc.cs - 1 === bd_c) {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                  borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }

                borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                  color: borderColor,
                  style: borderStyle,
                };
                borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                  color: borderColor,
                  style: borderStyle,
                };
                borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                  color: borderColor,
                  style: borderStyle,
                };
                borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                  color: borderColor,
                  style: borderStyle,
                };
              }

              if (bd_r === bd_r1) {
                const bd_r_top = bd_r1 - 1;

                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                  if (!_.isNil(data[bd_r_top]?.[bd_c]?.mc)) {
                    const cell_top = data[bd_r_top][bd_c];

                    const mc =
                      cfg.merge[`${cell_top?.mc?.r}_${cell_top?.mc?.c}`];

                    if (mc.r + mc.rs - 1 === bd_r_top) {
                      borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_r === bd_r2) {
                const bd_r_bottom = bd_r2 + 1;

                if (
                  bd_r_bottom < data.length &&
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
                ) {
                  if (!_.isNil(data[bd_r_bottom]?.[bd_c]?.mc)) {
                    const cell_bottom = data[bd_r_bottom][bd_c];

                    const mc =
                      cfg.merge[`${cell_bottom?.mc?.r}_${cell_bottom?.mc?.c}`];

                    if (mc.r === bd_r_bottom) {
                      borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_c === bd_c1) {
                const bd_c_left = bd_c1 - 1;

                if (
                  bd_c_left >= 0 &&
                  borderInfoCompute[`${bd_r}_${bd_c_left}`]
                ) {
                  if (!_.isNil(data[bd_r]?.[bd_c_left]?.mc)) {
                    const cell_left = data[bd_r][bd_c_left];

                    const mc =
                      cfg.merge[`${cell_left?.mc?.r}_${cell_left?.mc?.c}`];

                    if (mc.c + mc.cs - 1 === bd_c_left) {
                      borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_c === bd_c2) {
                const bd_c_right = bd_c2 + 1;

                if (
                  bd_c_right < data[0].length &&
                  borderInfoCompute[`${bd_r}_${bd_c_right}`]
                ) {
                  if (!_.isNil(data[bd_r]?.[bd_c_right]?.mc)) {
                    const cell_right = data[bd_r][bd_c_right];

                    const mc =
                      cfg.merge[`${cell_right?.mc?.r}_${cell_right?.mc?.c}`];

                    if (mc.c === bd_c_right) {
                      borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }
            }
          }
        } else if (borderType === "border-outside") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (
                !(
                  bd_r === bd_r1 ||
                  bd_r === bd_r2 ||
                  bd_c === bd_c1 ||
                  bd_c === bd_c2
                )
              ) {
                continue;
              }

              if (bd_r === bd_r1) {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                  borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }

                borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                  color: borderColor,
                  style: borderStyle,
                };

                const bd_r_top = bd_r1 - 1;

                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                  if (!_.isNil(data[bd_r_top]?.[bd_c]?.mc)) {
                    const cell_top = data[bd_r_top][bd_c];

                    const mc =
                      cfg.merge[`${cell_top?.mc?.r}_${cell_top?.mc?.c}`];

                    if (mc.r + mc.rs - 1 === bd_r_top) {
                      borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_r === bd_r2) {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                  borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }

                borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                  color: borderColor,
                  style: borderStyle,
                };

                const bd_r_bottom = bd_r2 + 1;

                if (
                  bd_r_bottom < data.length &&
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
                ) {
                  if (!_.isNil(data[bd_r_bottom]?.[bd_c]?.mc)) {
                    const cell_bottom = data[bd_r_bottom][bd_c];

                    const mc =
                      cfg.merge[`${cell_bottom?.mc?.r}_${cell_bottom?.mc?.c}`];

                    if (mc.r === bd_r_bottom) {
                      borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_c === bd_c1) {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                  borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }

                borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                  color: borderColor,
                  style: borderStyle,
                };

                const bd_c_left = bd_c1 - 1;

                if (
                  bd_c_left >= 0 &&
                  borderInfoCompute[`${bd_r}_${bd_c_left}`]
                ) {
                  if (!_.isNil(data[bd_r]?.[bd_c_left]?.mc)) {
                    const cell_left = data[bd_r][bd_c_left];

                    const mc =
                      cfg.merge[`${cell_left?.mc?.r}_${cell_left?.mc?.c}`];

                    if (mc.c + mc.cs - 1 === bd_c_left) {
                      borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }

              if (bd_c === bd_c2) {
                if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                  borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                }

                borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                  color: borderColor,
                  style: borderStyle,
                };

                const bd_c_right = bd_c2 + 1;

                if (
                  bd_c_right < data[0].length &&
                  borderInfoCompute[`${bd_r}_${bd_c_right}`]
                ) {
                  if (!_.isNil(data[bd_r]?.[bd_c_right]?.mc)) {
                    const cell_right = data[bd_r][bd_c_right];

                    const mc =
                      cfg.merge[`${cell_right?.mc?.r}_${cell_right?.mc?.c}`];

                    if (mc.c === bd_c_right) {
                      borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                        color: borderColor,
                        style: borderStyle,
                      };
                    }
                  } else {
                    borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                }
              }
            }
          }
        } else if (borderType === "border-inside") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (bd_r === bd_r1 && bd_c === bd_c1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r2 && bd_c === bd_c1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r1 && bd_c === bd_c2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r2 && bd_c === bd_c2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.c === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.c + mc.cs - 1 === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.c === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.c + mc.cs - 1 === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_c === bd_c1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.r === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.r + mc.rs - 1 === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_c === bd_c2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.r === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.r + mc.rs - 1 === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.r === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.r + mc.rs - 1 === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }

                  if (mc.c === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.c + mc.cs - 1 === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              }
            }
          }
        } else if (borderType === "border-horizontal") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (bd_r === bd_r1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_r === bd_r2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`];

                  if (mc.r === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.r + mc.rs - 1 === bd_r) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].t = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].b = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              }
            }
          }
        } else if (borderType === "border-vertical") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (bd_c === bd_c1) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else if (bd_c === bd_c2) {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              } else {
                if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
                  const cell = data[bd_r][bd_c];

                  const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`] || {};

                  if (mc.c === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  } else if (mc.c + mc.cs - 1 === bd_c) {
                    if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                      borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                    }

                    borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                      color: borderColor,
                      style: borderStyle,
                    };
                  }
                } else {
                  if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
                    borderInfoCompute[`${bd_r}_${bd_c}`] = {};
                  }

                  borderInfoCompute[`${bd_r}_${bd_c}`].l = {
                    color: borderColor,
                    style: borderStyle,
                  };
                  borderInfoCompute[`${bd_r}_${bd_c}`].r = {
                    color: borderColor,
                    style: borderStyle,
                  };
                }
              }
            }
          }
        } else if (borderType === "border-none") {
          for (let bd_r = bd_r1; bd_r <= bd_r2; bd_r += 1) {
            if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
              continue;
            }

            for (let bd_c = bd_c1; bd_c <= bd_c2; bd_c += 1) {
              if (!_.isNil(borderInfoCompute[`${bd_r}_${bd_c}`])) {
                delete borderInfoCompute[`${bd_r}_${bd_c}`];
              }

              if (bd_r === bd_r1) {
                const bd_r_top = bd_r1 - 1;

                if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
                  delete borderInfoCompute[`${bd_r_top}_${bd_c}`].b;
                }
              }

              if (bd_r === bd_r2) {
                const bd_r_bottom = bd_r2 + 1;

                if (
                  bd_r_bottom < data.length &&
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
                ) {
                  delete borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t;
                }
              }

              if (bd_c === bd_c1) {
                const bd_c_left = bd_c1 - 1;

                if (
                  bd_c_left >= 0 &&
                  borderInfoCompute[`${bd_r}_${bd_c_left}`]
                ) {
                  delete borderInfoCompute[`${bd_r}_${bd_c_left}`].r;
                }
              }

              if (bd_c === bd_c2) {
                const bd_c_right = bd_c2 + 1;

                if (
                  bd_c_right < data[0].length &&
                  borderInfoCompute[`${bd_r}_${bd_c_right}`]
                ) {
                  delete borderInfoCompute[`${bd_r}_${bd_c_right}`].l;
                }
              }
            }
          }
        }
      }
    } else if (rangeType === "cell") {
      const { value } = borderInfo[i];

      const bd_r = value.row_index;
      const bd_c = value.col_index;

      if (
        bd_r < dataset_row_st ||
        bd_r > dataset_row_ed ||
        bd_c < dataset_col_st ||
        bd_c > dataset_col_ed
      ) {
        continue;
      }

      if (!_.isNil(cfg.rowhidden) && !_.isNil(cfg.rowhidden[bd_r])) {
        continue;
      }

      if (
        !_.isNil(value.l) ||
        !_.isNil(value.r) ||
        !_.isNil(value.t) ||
        !_.isNil(value.b)
      ) {
        if (borderInfoCompute[`${bd_r}_${bd_c}`] === undefined) {
          borderInfoCompute[`${bd_r}_${bd_c}`] = {};
        }

        if (!_.isNil(data[bd_r]?.[bd_c]?.mc)) {
          const cell = data[bd_r][bd_c];
          const mc = cfg.merge[`${cell?.mc?.r}_${cell?.mc?.c}`] || {};

          if (!_.isNil(value.l) && bd_c === mc.c) {
            // 左边框
            borderInfoCompute[`${bd_r}_${bd_c}`].l = {
              color: value.l.color,
              style: value.l.style,
            };

            const bd_c_left = bd_c - 1;

            if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
              if (!_.isNil(data[bd_r]?.[bd_c_left]?.mc)) {
                const cell_left = data[bd_r][bd_c_left];

                const mc_l =
                  cfg.merge[`${cell_left?.mc?.r}_${cell_left?.mc?.c}`];

                if (mc_l.c + mc_l.cs - 1 === bd_c_left) {
                  borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                    color: value.l.color,
                    style: value.l.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                  color: value.l.color,
                  style: value.l.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].l = null;
          }

          if (!_.isNil(value.r) && bd_c === mc.c + mc.cs - 1) {
            // 右边框
            borderInfoCompute[`${bd_r}_${bd_c}`].r = {
              color: value.r.color,
              style: value.r.style,
            };

            const bd_c_right = bd_c + 1;

            if (
              bd_c_right < data[0].length &&
              borderInfoCompute[`${bd_r}_${bd_c_right}`]
            ) {
              if (!_.isNil(data[bd_r]?.[bd_c_right]?.mc)) {
                const cell_right = data[bd_r][bd_c_right];

                const mc_r =
                  cfg.merge[`${cell_right?.mc?.r}_${cell_right?.mc?.c}`];

                if (mc_r.c === bd_c_right) {
                  borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                    color: value.r.color,
                    style: value.r.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                  color: value.r.color,
                  style: value.r.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].r = null;
          }

          if (!_.isNil(value.t) && bd_r === mc.r) {
            // 上边框
            borderInfoCompute[`${bd_r}_${bd_c}`].t = {
              color: value.t.color,
              style: value.t.style,
            };

            const bd_r_top = bd_r - 1;

            if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
              if (!_.isNil(data[bd_r_top]?.[bd_c]?.mc)) {
                const cell_top = data[bd_r_top][bd_c];

                const mc_t = cfg.merge[`${cell_top?.mc?.r}_${cell_top?.mc?.c}`];

                if (mc_t.r + mc_t.rs - 1 === bd_r_top) {
                  borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                    color: value.t.color,
                    style: value.t.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                  color: value.t.color,
                  style: value.t.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].t = null;
          }

          if (!_.isNil(value.b) && bd_r === mc.r + mc.rs - 1) {
            // 下边框
            borderInfoCompute[`${bd_r}_${bd_c}`].b = {
              color: value.b.color,
              style: value.b.style,
            };

            const bd_r_bottom = bd_r + 1;

            if (
              bd_r_bottom < data.length &&
              borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
            ) {
              if (!_.isNil(data[bd_r_bottom]?.[bd_c]?.mc)) {
                const cell_bottom = data[bd_r_bottom][bd_c];

                const mc_b =
                  cfg.merge[`${cell_bottom?.mc?.r}_${cell_bottom?.mc?.c}`];

                if (mc_b.r === bd_r_bottom) {
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                    color: value.b.color,
                    style: value.b.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                  color: value.b.color,
                  style: value.b.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].b = null;
          }
        } else {
          if (!_.isNil(value.l)) {
            // 左边框
            borderInfoCompute[`${bd_r}_${bd_c}`].l = {
              color: value.l.color,
              style: value.l.style,
            };

            const bd_c_left = bd_c - 1;

            if (bd_c_left >= 0 && borderInfoCompute[`${bd_r}_${bd_c_left}`]) {
              if (!_.isNil(data[bd_r]?.[bd_c_left]?.mc)) {
                const cell_left = data[bd_r][bd_c_left];

                const mc_l =
                  cfg.merge[`${cell_left?.mc?.r}_${cell_left?.mc?.c}`];

                if (mc_l.c + mc_l.cs - 1 === bd_c_left) {
                  borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                    color: value.l.color,
                    style: value.l.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_left}`].r = {
                  color: value.l.color,
                  style: value.l.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].l = null;
          }

          if (!_.isNil(value.r)) {
            // 右边框
            borderInfoCompute[`${bd_r}_${bd_c}`].r = {
              color: value.r.color,
              style: value.r.style,
            };

            const bd_c_right = bd_c + 1;

            if (
              bd_c_right < data[0].length &&
              borderInfoCompute[`${bd_r}_${bd_c_right}`]
            ) {
              if (
                !_.isNil(data[bd_r]) &&
                _.isPlainObject(data[bd_r][bd_c_right]) &&
                !_.isNil(data[bd_r]?.[bd_c_right]?.mc)
              ) {
                const cell_right = data[bd_r][bd_c_right];

                const mc_r =
                  cfg.merge[`${cell_right?.mc?.r}_${cell_right?.mc?.c}`];

                if (mc_r.c === bd_c_right) {
                  borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                    color: value.r.color,
                    style: value.r.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r}_${bd_c_right}`].l = {
                  color: value.r.color,
                  style: value.r.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].r = null;
          }

          if (!_.isNil(value.t)) {
            // 上边框
            borderInfoCompute[`${bd_r}_${bd_c}`].t = {
              color: value.t.color,
              style: value.t.style,
            };

            const bd_r_top = bd_r - 1;

            if (bd_r_top >= 0 && borderInfoCompute[`${bd_r_top}_${bd_c}`]) {
              if (!_.isNil(data[bd_r_top]?.[bd_c]?.mc)) {
                const cell_top = data[bd_r_top][bd_c];

                const mc_t = cfg.merge[`${cell_top?.mc?.r}_${cell_top?.mc?.c}`];

                if (mc_t.r + mc_t.rs - 1 === bd_r_top) {
                  borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                    color: value.t.color,
                    style: value.t.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_top}_${bd_c}`].b = {
                  color: value.t.color,
                  style: value.t.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].t = null;
          }

          if (!_.isNil(value.b)) {
            // 下边框
            borderInfoCompute[`${bd_r}_${bd_c}`].b = {
              color: value.b.color,
              style: value.b.style,
            };

            const bd_r_bottom = bd_r + 1;

            if (
              bd_r_bottom < data.length &&
              borderInfoCompute[`${bd_r_bottom}_${bd_c}`]
            ) {
              if (!_.isNil(data[bd_r_bottom]?.[bd_c]?.mc)) {
                const cell_bottom = data[bd_r_bottom][bd_c];

                const mc_b =
                  cfg.merge[`${cell_bottom?.mc?.r}_${cell_bottom?.mc?.c}`];

                if (mc_b.r === bd_r_bottom) {
                  borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                    color: value.b.color,
                    style: value.b.style,
                  };
                }
              } else {
                borderInfoCompute[`${bd_r_bottom}_${bd_c}`].t = {
                  color: value.b.color,
                  style: value.b.style,
                };
              }
            }
          } else {
            borderInfoCompute[`${bd_r}_${bd_c}`].b = null;
          }
        }
      } else {
        delete borderInfoCompute[`${bd_r}_${bd_c}`];
      }
    }
  }

  return borderInfoCompute;
}

export function getBorderInfoCompute(ctx: Context, sheetIndex?: string) {
  let borderInfoCompute: any = {};
  const flowdata = getFlowdata(ctx);

  let data: any = {};
  if (sheetIndex === undefined) {
    data = flowdata;
  } else {
    const index = getSheetIndex(ctx, sheetIndex);
    if (!_.isNil(index)) {
      data = ctx.luckysheetfile[index].data;
    } else {
      return borderInfoCompute;
    }
  }

  borderInfoCompute = getBorderInfoComputeRange(
    ctx,
    0,
    data.length,
    0,
    data[0].length,
    sheetIndex
  );

  return borderInfoCompute;
}
