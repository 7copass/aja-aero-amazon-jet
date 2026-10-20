import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectLang, translate, type Lang } from "@/lib/translations";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (s: string) => string };

const LangContext = createContext<Ctx>({ lang: "pt", setLang: () => {}, tr: (s) => s });

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start in pt, resolve real language on the client to avoid hydration mismatch.
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aja-lang", l);
      document.documentElement.lang = l === "pt" ? "pt-BR" : l;
    }
  };

  const tr = (s: string) => translate(s, lang);

  return <LangContext.Provider value={{ lang, setLang, tr }}>{children}</LangContext.Provider>;
}

export function useTr() {
  return useContext(LangContext);
}
