import { Context } from "../context";

export function showImgChooser() {
  const chooser = document.getElementById(
    "luckysheet-imgUpload"
  ) as HTMLInputElement;
  if (chooser) chooser.click();
}
function _insertImg(src: any, ctx: Context, setContext: any) {
  // if (ctx.luckysheet_select_save == null) return;
  // if (ctx.luckysheet_select_save === undefined) return;
  // console.info("ppppp");
  // const last =
  //   ctx.luckysheet_select_save[ctx.luckysheet_select_save.length - 1];
  // console.info(last);
  // const rowIndex = last?.row_focus || 0;
  // const colIndex = last?.column_focus || 0;
  // const left = colIndex === 0 ? 0 : ctx.visibledatacolumn[colIndex - 1];
  // const top = rowIndex === 0 ? 0 : ctx.visibledatarow[rowIndex - 1];

  try {
    const last =
      ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
    let rowIndex = last?.row_focus;
    let colIndex = last?.column_focus;
    if (!last) {
      rowIndex = 0;
      colIndex = 0;
    } else {
      if (rowIndex == null) {
        [rowIndex] = last.row;
      }
      if (colIndex == null) {
        [colIndex] = last.column;
      }
    }
    const left = colIndex === 0 ? 0 : ctx.visibledatacolumn[colIndex - 1];
    const top = rowIndex === 0 ? 0 : ctx.visibledatarow[rowIndex - 1];
    const image = new Image();
    image.onload = () => {
      const { width } = image;
      const { height } = image;
      const img = {
        src,
        left,
        top,
        width,
        height,
        originWidth: width,
        originHeight: height,
      };
      setContext((draftCtx: Context) => {
        draftCtx.insertedImgs = (draftCtx.insertedImgs || []).concat(img);
      });
    };
    // addImgItem(img);
    // };
    // const imageUrlHandle =
    //   Store.toJsonOptions && Store.toJsonOptions.imageUrlHandle;
    // image.src = typeof imageUrlHandle === "function" ? imageUrlHandle(src) : src;
    image.src = src;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.info(err);
  }
}
// }

export function insertImage(setContext: any, file: any) {
  // const uploadImage = ctx.toJsonOptions && Store.toJsonOptions.uploadImage;
  // if (typeof uploadImage === "function") {
  //   // 上传形式
  //   uploadImage(file)
  //     .then((url) => {
  //       imageCtrl._insertImg(url);
  //     })
  //     .catch((error) => {
  //       tooltip.info(
  //         '<i class="fa fa-exclamation-triangle"></i>',
  //         "图片上传失败"
  //       );
  //     });
  // } else {
  // 内部base64形式
  const render = new FileReader();
  render.readAsDataURL(file);

  render.onload = (event) => {
    if (event.target == null) return;
    const src = event.target?.result;

    setContext((ctx: Context) => {
      _insertImg(src, ctx, setContext);
    });
    // $("#luckysheet-imgUpload").val("");
  };
}

// function addImgItem(img: any, ctx: Context) {
//   let width;
//   let height;
//   const max = 400;

//   if (img.originHeight < img.originWidth) {
//     height = Math.round(img.originHeight * (max / img.originWidth));
//     width = max;
//   } else {
//     width = Math.round(img.originWidth * (max / img.originHeight));
//     height = max;
//   }
//   if (ctx.insertedImgs == null) {
//     ctx.insertedImgs = {};
//   }

// const imgItem = $.extend(true, {},  imgItem);
// imgItem.src = img.src;
// imgItem.originWidth = img.originWidth;
// imgItem.originHeight = img.originHeight;
// imgItem.default.width = width;
// imgItem.default.height = height;
// imgItem.default.left = img.left;
// imgItem.default.top = img.top;
// imgItem.crop.width = width;
// imgItem.crop.height = height;

// const scrollTop = $("#luckysheet-cell-main").scrollTop();
// const scrollLeft = $("#luckysheet-cell-main").scrollLeft();

// imgItem.fixedLeft = img.left - scrollLeft + ctx.rowHeaderWidth;
// imgItem.fixedTop =
//   img.top -
//   scrollTop +
//   ctx.infobarHeight +
//   ctx.toolbarHeight +
//   ctx.calculatebarHeight +
//   ctx.columnHeaderHeight;

// const id = generateRandomId();
// const modelHtml = _this.modelHtml(id, imgItem);

// $("#luckysheet-image-showBoxs .img-list").append(modelHtml);

// images[id] = imgItem;
//   ref();

//   init();
// }
