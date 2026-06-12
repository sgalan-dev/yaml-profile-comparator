import { isPlainObject } from './merge.js';

export function flatten(obj, prefix = '') {
  let keys = [];
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      const segment = String(idx);
      const fullKey = prefix ? `${prefix}.${segment}` : segment;
      if (isPlainObject(item) || Array.isArray(item)) {
        keys = keys.concat(flatten(item, fullKey));
      } else {
        keys.push(fullKey);
      }
    });
    return keys;
  }
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (isPlainObject(value) || Array.isArray(value)) {
      keys = keys.concat(flatten(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
