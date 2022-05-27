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

function isInPage(node: Node) {
  return node === document.body ? false : document.body.contains(node);
}

export function selectTextContent(ele: HTMLElement) {
  if (window.getSelection) {
    const range = document.createRange();
    const content = ele.firstChild as Text;
    if (content) {
      range.setStart(content, 0);
      range.setEnd(content, content.length);
      if (range.startContainer && isInPage(range.startContainer)) {
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
    // @ts-ignore
  } else if (document.selection) {
    // @ts-ignore
    const range = document.body.createTextRange();
    range.moveToElementText(ele);
    range.select();
  }
}

export function selectTextContentCross(sEle: HTMLElement, eEle: HTMLElement) {
  if (window.getSelection) {
    const range = document.createRange();
    const sContent = sEle.firstChild;
    const eContent = eEle.firstChild as Text;
    if (sContent && eContent) {
      range.setStart(sContent, 0);
      range.setEnd(eContent, eContent.length);
      if (range.startContainer && isInPage(range.startContainer)) {
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }
}
