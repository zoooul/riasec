/**
 * RIASEC internationalization
 *
 * A locale becomes available as soon as its file calls registerLocale().
 * Add a language: copy js/locales/_template.js, translate it, include the
 * script in index.html. Optional: add the code to LOCALE_ORDER below.
 */
const LOCALE_STORAGE_KEY = 'riasec-locale-v1';

/** Preferred button/select order. Extra registered locales are appended. */
const LOCALE_ORDER = ['de', 'en', 'fa', 'es', 'fr', 'tr', 'uk', 'ru'];

const LOCALE_ALIASES = {
  ps: 'fa',
  'fa-ir': 'fa',
  'en-us': 'en',
  'en-gb': 'en',
  'de-de': 'de',
  'de-at': 'de',
  'de-ch': 'de',
  'es-es': 'es',
  'es-mx': 'es',
  'fr-fr': 'fr',
  'tr-tr': 'tr',
  'uk-ua': 'uk',
  'ru-ru': 'ru',
};

const localeRegistry = {};

function registerLocale(code, data) {
  localeRegistry[code] = data;
}

function getAvailableLocales() {
  const registered = Object.keys(localeRegistry);
  const ordered = LOCALE_ORDER.filter((code) => localeRegistry[code]);
  const extra = registered.filter((code) => !LOCALE_ORDER.includes(code));
  extra.sort();
  return ordered.concat(extra);
}

function detectBrowserLocale() {
  const raw = String(navigator.language || navigator.userLanguage || 'de').toLowerCase();
  const short = raw.slice(0, 2);
  const mapped = LOCALE_ALIASES[raw] || LOCALE_ALIASES[short] || short;
  if (localeRegistry[mapped]) return mapped;
  if (localeRegistry.en) return 'en';
  if (localeRegistry.de) return 'de';
  return getAvailableLocales()[0] || 'de';
}

function getStoredLocaleCode() {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

let currentLocale = 'de';

function resolveInitialLocale() {
  const stored = getStoredLocaleCode();
  if (stored && localeRegistry[stored]) {
    currentLocale = stored;
    return;
  }
  currentLocale = detectBrowserLocale();
}

function getLocale() {
  return currentLocale;
}

function getLocaleData() {
  return (
    localeRegistry[currentLocale] ||
    localeRegistry.de ||
    localeRegistry.en ||
    localeRegistry[getAvailableLocales()[0]]
  );
}

function setLocale(code) {
  if (!localeRegistry[code]) return;
  currentLocale = code;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
  applyDocumentLocale();
}

function applyDocumentLocale() {
  const data = getLocaleData();
  if (!data) return;
  document.documentElement.lang = data.meta.lang;
  document.documentElement.dir = data.meta.dir || 'ltr';
  document.title = data.meta.pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = data.meta.description;
}

function t(key, params = {}) {
  const data = getLocaleData();
  const parts = key.split('.');
  let value = data;
  for (const part of parts) {
    value = value?.[part];
    if (value == null) return key;
  }
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : `{${k}}`));
}

function getTypeInfo() {
  return getLocaleData().typeInfo;
}

function getSections() {
  return getLocaleData().sections;
}

function getQuestions() {
  return getLocaleData().questions;
}

function getSelfAssessment() {
  return getLocaleData().selfAssessment;
}

function getSectionBreakMessages() {
  return getLocaleData().sectionBreaks;
}

function getIntroText() {
  return getLocaleData().introText;
}

function describeCombination(topThree) {
  const fn = getLocaleData().describeCombination;
  const typeInfo = getTypeInfo();
  if (typeof fn !== 'function') return '';
  return fn(topThree, typeInfo);
}

function formatDate(date) {
  const locale = getLocaleData().meta.dateLocale || 'de-DE';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function onLocaleChange(callback) {
  document.addEventListener('riasec:localechange', callback);
}

function emitLocaleChange() {
  document.dispatchEvent(new CustomEvent('riasec:localechange', { detail: { locale: currentLocale } }));
}

function switchLocale(code) {
  if (code === currentLocale) return;
  setLocale(code);
  emitLocaleChange();
}
