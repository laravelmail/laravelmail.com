import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang as keyof typeof ui;
}

export function useTranslations(lang: keyof typeof ui) {
  const safeLang = (lang && lang in ui ? lang : defaultLang) as keyof typeof ui;
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return (ui[safeLang] as any)?.[key] ?? (ui[defaultLang] as any)?.[key] ?? (key as string);
  }
}
