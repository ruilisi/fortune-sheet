export default class clipboard {
  static writeHtml(str: string) {
    try {
      let ele = document.getElementById("luckysheet-copy-content");
      if (!ele) {
        ele = document.createElement("div");
        ele.setAttribute("contentEditable", "true");
        ele.id = "luckysheet-copy-content";
        ele.innerHTML = str;
        ele.style.position = "fixed";
        ele.style.height = "0";
        ele.style.width = "0";
        ele.style.display = "none";
        document.querySelector(".fortune-container")?.append(ele);
      }
      ele.focus();
      document.execCommand("selectAll");
      document.execCommand("copy");
    } catch (e) {
      console.error(e);
    }
  }
}
