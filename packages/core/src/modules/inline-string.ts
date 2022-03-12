import { getCellValue } from "./cell";

export function isInlineStringCell(cell: any): boolean {
  return cell?.ct?.t === "inlineStr" && (cell?.ct?.s?.length ?? 0) > 0;
}

export function isInlineStringCT(ct: any): boolean {
  return ct?.t === "inlineStr" && (ct?.s?.length ?? 0) > 0;
}

export function getInlineStringNoStyle(r: number, c: number, data: any) {
  const ct = getCellValue(r, c, data, "ct");
  if (isInlineStringCT(ct)) {
    const strings = ct.s;
    let value = "";
    for (let i = 0; i < strings.length; i += 1) {
      const strObj = strings[i];
      if (strObj.v) {
        value += strObj.v;
      }
    }
    return value;
  }
  return "";
}

/*
export function getInlineStringStyle(r: number, c: number, data: any) {
  const ct = getCellValue(r, c, data, "ct");
  if (isInlineStringCT(ct)) {
    const strings = ct.s;
    let value = "";
    for (let i = 0; i < strings.length; i += 1) {
      const strObj = strings[i];
      if (strObj.v != null) {
        const style = getFontStyleByCell(strObj);
        value += `<span index='${i}' style='${style}'>${strObj.v}</span>`;
      }
    }
    return value;
  }
  return "";
}
*/
