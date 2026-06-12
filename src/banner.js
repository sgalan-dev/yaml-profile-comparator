import chalk from 'chalk';
import gradient from 'gradient-string';
import { stdout as isTTY } from 'node:process';

const ART_TTY = [
  '██╗   ██╗ █████╗ ███╗   ███╗██╗     ',
  '╚██╗ ██╔╝██╔══██╗████╗ ████║██║     ',
  ' ╚████╔╝ ███████║██╔████╔██║██║     ',
  '  ╚██╔╝  ██╔══██║██║╚██╔╝██║██║     ',
  '   ██║   ██║  ██║██║ ╚═╝ ██║███████╗',
  '   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝',
];

const ART_PIPE = [
  '_   _   __ _  _ _ _  _   ',
  '| |_| | / _  || ` ` || |  ',
  '\\_   _/| (_) || | | || |_ ',
  '  |_|   \\__,_||_|_|_||___|',
];

const TITLE = 'profile comparator';
const CREDIT = '<sgalan.dev/>';

const lilaChars = new Set(['<', '>', '.', '/']);
const yamlGradient = gradient(['#22d3ee', '#c084fc', '#f472b6']);

function pad(s, width) {
  const left = Math.max(0, Math.floor((width - s.length) / 2));
  return ' '.repeat(left) + s;
}

function renderCredit(s) {
  if (!isTTY.isTTY) return s;
  let out = '';
  for (const ch of s) {
    out += lilaChars.has(ch) ? chalk.hex('#c084fc')(ch) : ch;
  }
  return out;
}

export function renderBanner() {
  const art = isTTY.isTTY ? ART_TTY : ART_PIPE;
  const artWidth = Math.max(...art.map((l) => l.length));
  const targetWidth = Math.max(artWidth, TITLE.length, CREDIT.length);

  for (const line of art) {
    const colored = isTTY.isTTY ? chalk.bold(yamlGradient(line)) : line;
    console.log(pad(colored, targetWidth));
  }
  console.log('');
  const title = isTTY.isTTY ? chalk.bold(yamlGradient(TITLE)) : TITLE;
  console.log(pad(title, targetWidth));
  console.log(pad(renderCredit(CREDIT), targetWidth));
  console.log('');
}
