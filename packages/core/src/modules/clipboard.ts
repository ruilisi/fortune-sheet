export default class clipboard {
  static writeHtml(str: string) {
    try {
      let ele = document.getElementById("fortune-copy-content");
      if (!ele) {
        ele = document.createElement("div");
        ele.setAttribute("contentEditable", "true");
        ele.id = "fortune-copy-content";
        ele.style.position = "fixed";
        ele.style.height = "0";
        ele.style.width = "0";
        ele.style.left = "-10000px";
        document.querySelector(".fortune-container")?.append(ele);
      }
      ele.style.display = "block";
      ele.innerHTML = str;
      ele.focus({ preventScroll: true });
      document.execCommand("selectAll");
      document.execCommand("copy");
    } catch (e) {
      console.error(e);
    }
  }
}
