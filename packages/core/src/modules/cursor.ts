export function moveToEnd(obj: HTMLDivElement) {
  if (document.createRange) {
    // chrome, firefox, opera, safari, ie9+
    if (obj.innerHTML !== obj.innerText || obj.innerHTML === "") {
      obj.focus(); // 解决ff不获取焦点无法定位问题
      const range = window.getSelection(); // 创建range
      range?.selectAllChildren(obj); // range 选择obj下所有子内容
      range?.collapseToEnd(); // 光标移至最后
    } else {
      const len = obj.innerText.length;
      const range = document.createRange();
      range.selectNodeContents(obj);
      range.setStart(obj.childNodes[0], len);
      range.collapse(true);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    // @ts-ignore
  } else if (document.selection) {
    // ie8 and lower
    // @ts-ignore
    const range = document.body.createTextRange();
    range.moveToElementText(obj);
    range.collapse(false);
    range.select();
  }
}
