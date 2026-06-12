function diffKeys(keysA, keysB) {
  const setB = new Set(keysB);
  const setA = new Set(keysA);
  const missingInB = keysA.filter((k) => !setB.has(k)).sort();
  const missingInA = keysB.filter((k) => !setA.has(k)).sort();
  return { missingInB, missingInA };
}

module.exports = { diffKeys };
