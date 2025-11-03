import en from "./en";
import zh from "./zh";
import es from "./es";
import hi from "./hi";
import ru from "./ru";
import zh_tw from "./zh_tw";
import { Context } from "..";

const localeObj: Record<string, typeof zh> = {
  // @ts-ignore
  en,
  zh,
  // @ts-ignore
  es,
  // @ts-ignore
  "zh-TW": zh_tw,
  // @ts-ignore
  hi,
  // @ts-ignore
  ru,
};

function locale(ctx: Context) {
  const langsToTry = [ctx.lang || "", ctx.lang?.split("-")[0] || ""];
  for (let i = 0; i < langsToTry.length; i += 1) {
    if (langsToTry[i] in localeObj) {
      return localeObj[langsToTry[i]];
    }
  }
  return localeObj.en;
}

export { locale };
