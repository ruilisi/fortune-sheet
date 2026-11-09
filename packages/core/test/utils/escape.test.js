import {
  escapeHTMLTag,
  unescapeHTMLTag,
  functionHTMLGenerate,
  getInlineStringHTML,
} from "../../src";

const payload = "<img src=x onerror=alert(1)>";

const toElement = (html) => {
  const ele = document.createElement("div");
  ele.innerHTML = html;
  return ele;
};

describe("escapeHTMLTag", () => {
  test("escapes plain text", () => {
    expect(escapeHTMLTag(`a ${payload}`)).toBe(
      "a &lt;img src=x onerror=alert(1)&gt;"
    );
  });

  test("escapes text starting with <span", () => {
    const ele = toElement(escapeHTMLTag(`<span>${payload}`));
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(`<span>${payload}`);
  });

  test("escapes text starting with =", () => {
    const ele = toElement(escapeHTMLTag(`=${payload}`));
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(`=${payload}`);
  });

  test("escapes ampersands", () => {
    expect(toElement(escapeHTMLTag("&lt;b&gt;")).textContent).toBe("&lt;b&gt;");
  });

  test("is reversed by unescapeHTMLTag", () => {
    const text = `&lt; "a" 'b' ${payload}`;
    expect(unescapeHTMLTag(escapeHTMLTag(text))).toBe(text);
  });
});

describe("getInlineStringHTML", () => {
  const inlineStringData = (runs) => [[{ ct: { t: "inlineStr", s: runs } }]];

  test("escapes run text", () => {
    const html = getInlineStringHTML(0, 0, inlineStringData([{ v: payload }]));
    const ele = toElement(html);
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(payload);
  });

  test("escapes run text starting with <span", () => {
    const html = getInlineStringHTML(
      0,
      0,
      inlineStringData([{ v: `<span>${payload}` }])
    );
    expect(toElement(html).querySelector("img")).toBeNull();
  });

  test("escapes style values", () => {
    const html = getInlineStringHTML(
      0,
      0,
      inlineStringData([{ v: "text", fc: `red'>${payload}` }])
    );
    const ele = toElement(html);
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe("text");
  });

  test("keeps one styled span per run", () => {
    const html = getInlineStringHTML(
      0,
      0,
      inlineStringData([{ v: "bold", bl: 1 }, { v: " plain" }])
    );
    const spans = toElement(html).querySelectorAll("span");
    expect(spans).toHaveLength(2);
    expect(spans[0].style.fontWeight).toBe("bold");
    expect(spans[0].textContent).toBe("bold");
    expect(spans[1].textContent).toBe(" plain");
  });
});

describe("functionHTMLGenerate", () => {
  test("escapes string literals", () => {
    const formula = `="${payload}"`;
    const ele = toElement(functionHTMLGenerate(formula));
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(formula);
  });

  test("escapes text that is not a function call", () => {
    const formula = `=${payload}`;
    const ele = toElement(functionHTMLGenerate(formula));
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(formula);
  });

  test("keeps comparison operators readable", () => {
    const formula = "=IF(A1<>B1,A1<=1,A1>=2)&C1";
    expect(toElement(functionHTMLGenerate(formula)).textContent).toBe(formula);
  });

  test("escapes text that does not start with =", () => {
    const ele = toElement(functionHTMLGenerate(payload));
    expect(ele.querySelector("img")).toBeNull();
    expect(ele.textContent).toBe(payload);
  });

  test("keeps ampersands, quotes and sheet references readable", () => {
    const formula = `='a&b'!A1&"x<y & z"&{1,"<i>"}`;
    const ele = toElement(functionHTMLGenerate(formula));
    expect(ele.querySelector("i")).toBeNull();
    expect(ele.textContent).toBe(formula);
  });
});
