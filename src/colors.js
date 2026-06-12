const useColor = process.stdout.isTTY === true;

const wrap = (code) => (s) => useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s);

module.exports = {
  red:    wrap('31'),
  green:  wrap('32'),
  yellow: wrap('33'),
  blue:   wrap('34'),
  bold:   wrap('1'),
  dim:    wrap('2'),
  isColorEnabled: () => useColor,
};
