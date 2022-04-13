import en from "./en";
import zh from "./zh";
import es from "./es";
import zh_tw from "./zh_tw";
import { Context } from "..";

// @ts-ignore
const localeObj: Record<string, typeof zh> = { en, zh, es, "zh-TW": zh_tw };

function locale(ctx: Context) {
  const langsToTry = [ctx.lang || "", ctx.lang?.split("-")[0] || ""];
  for (let i = 0; i < langsToTry.length; i += 1) {
    if (langsToTry[i] in localeObj) {
      return localeObj[langsToTry[i]];
    }
  }
  return localeObj.zh;
}

export { locale };
