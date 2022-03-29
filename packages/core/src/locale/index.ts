import en from "./en";
import zh from "./zh";
import es from "./es";
import zh_tw from "./zh_tw";

const localeObj: Record<string, typeof zh> = { en, zh, es, zh_tw };

function locale() {
  return localeObj[localStorage.getItem("lang") || "zh"];
}

export { locale };
