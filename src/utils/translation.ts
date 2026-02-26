import i18n, { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import intervalPlural from "i18next-intervalplural-postprocessor";

import en from "./translations/en";
import hi from "./translations/hi";
import hg from "./translations/hg";
import gu from "./translations/gu";
import ta from "./translations/ta";
import ml from "./translations/ml";
import kn from "./translations/kn";
import bn from "./translations/bn";
import mr from "./translations/mr";

import { storage } from "../data/Storage";

export const supportedLanguages = new Map<string, string>([
  ["en", "english"],
  ["hi", "हिन्दी"],
  ["bn", "বাংলা"],
  ["gu", "ગુજરાતી"],
  ["hg", "hinglish"],
  ["kn", "ಕನ್ನಡ"],
  ["ml", "മലയാളം"],
  ["mr", "मराठी"],
  ["ta", "தமிழ்"],
]);

const defaultLanguageCode = "en";
let currentLanguage = defaultLanguageCode;

export async function init() {
  await i18n
    .use(initReactI18next)
    .use(intervalPlural)
    .init({
      resources: {
        en: {
          translation: en,
        },
        hi: {
          translation: hi,
        },
        hg: {
          translation: hg,
        },
        gu: {
          translation: gu,
        },
        ta: {
          translation: ta,
        },
        ml: {
          translation: ml,
        },
        kn: {
          translation: kn,
        },
        bn: {
          translation: bn,
        },
        mr: {
          translation: mr,
        },
      },
      lng: (await storage.getUnsafe.language()) || navigator.language,
      fallbackLng: {
        hi: ["hi"],
        hg: ["hg"],
        gu: ["gu"],
        ta: ["ta"],
        ml: ["ml"],
        kn: ["kn"],
        bn: ["bn"],
        mr: ["mr"],
        default: [defaultLanguageCode],
      },
    } satisfies InitOptions);

  const appLanguage = i18n.languages.at(-1);

  if (!appLanguage) {
    throw new Error("Can't get language from i18next");
  }

  currentLanguage = appLanguage;
  await storage.set.language(appLanguage);

  console.log(`App language is ${appLanguage}`);
}

export function changeTranslation(language: string) {
  if (!supportedLanguages.has(language)) {
    console.warn(`Language ${language} is not supported yet`);
    return;
  }
  currentLanguage = language;
  return i18n.changeLanguage(language);
}

export function getCurrentTranslation(): string {
  return currentLanguage;
}
