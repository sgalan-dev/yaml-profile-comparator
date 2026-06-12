function isPlainObject(item) {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return isPlainObject(override) ? { ...override } : override;
  }
  const output = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      output[key] = mergeDeep(baseVal, overrideVal);
    } else {
      output[key] = overrideVal;
    }
  }
  return output;
}

module.exports = { mergeDeep, isPlainObject };
