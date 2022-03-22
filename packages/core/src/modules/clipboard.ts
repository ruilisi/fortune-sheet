export default class clipboard {
  static writeHtml(str: string) {
    try {
      const ele = document.createElement("div");
      ele.setAttribute("contentEditable", "true");
      ele.innerHTML = str;
      ele.style.position = "fixed";
      ele.style.height = "0";
      ele.style.width = "0";
      ele.style.left = "-100px";
      document.body.append(ele);
      ele.focus();
      document.execCommand("selectAll");
      document.execCommand("copy");
      setTimeout(() => ele.remove(), 50);
    } catch (e) {
      console.error(e);
    }
  }
}
