import es from './locales/es.js';
import en from './locales/en.js';

export const LOCALES = { es, en };

let currentLocale = 'en';

export function getLocale() {
  return currentLocale;
}

export function setLocale(code) {
  if (code !== 'es' && code !== 'en') {
    return false;
  }
  currentLocale = code;
  return true;
}

function resolvePath(locale, key) {
  const parts = key.split('.');
  let node = locale;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

function formatString(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const v = params[name];
    return v === undefined ? match : String(v);
  });
}

export function t(key, params) {
  const value = resolvePath(LOCALES[currentLocale], key);
  if (value === undefined) {
    return key;
  }
  if (typeof value === 'function') {
    return value(params);
  }
  if (typeof value === 'string') {
    return formatString(value, params);
  }
  return value;
}
