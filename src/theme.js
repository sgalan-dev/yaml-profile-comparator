import chalk from 'chalk';
import { stdout as isTTY } from 'node:process';

const CYAN = '#22d3ee';
const LILA = '#c084fc';
const ROSA = '#f472b6';

function identity(s) { return s; }

const ttyTheme = {
  style: {
    message: (text) => chalk.bold.hex(CYAN)(text),
    description: (text) => chalk.dim(text),
    pointer: (text) => chalk.hex(ROSA)(text),
    highlight: (text) => chalk.bold.hex(LILA)(text),
    help: (text) => chalk.dim(text),
    error: (text) => chalk.red(text),
    defaultAnswer: (text) => chalk.dim(text),
  },
};

const plainTheme = {
  style: {
    message: identity,
    description: identity,
    pointer: identity,
    highlight: identity,
    help: identity,
    error: identity,
    defaultAnswer: identity,
  },
};

export const promptTheme = isTTY.isTTY ? ttyTheme : plainTheme;
