import * as c from './colors.js';
import { t } from './i18n.js';

export function renderHeader(title) {
  console.log('');
  console.log(c.bold(c.blue(title)));
  console.log(c.dim('-'.repeat(title.length)));
}

export function renderSummary(resolved) {
  renderHeader(t('summary.title'));
  if (resolved.base) {
    console.log(`  ${c.bold('base')}  -> ${c.blue(resolved.base)}`);
  } else {
    console.log(`  ${c.bold('base')}  -> ${c.dim(t('summary.noBase'))}`);
  }
  console.log(`  ${c.bold(resolved.profileAName)} -> ${c.blue(resolved.profileA)}`);
  console.log(`  ${c.bold(resolved.profileBName)} -> ${c.blue(resolved.profileB)}`);
}

export function renderDiff({ profileAName, profileBName, missingInB, missingInA }) {
  console.log('');
  console.log(c.bold(t('diff.title')));
  console.log(c.dim('-'.repeat(t('diff.title').length)));

  let hasErrors = false;

  if (missingInB.length > 0) {
    console.log('');
    console.log(c.red(t('diff.missingInB', { a: profileAName, b: profileBName })));
    for (const key of missingInB) {
      console.log(`  ${c.red('-')} ${key}`);
    }
    hasErrors = true;
  }

  if (missingInA.length > 0) {
    console.log('');
    console.log(c.yellow(t('diff.missingInA', { a: profileAName, b: profileBName })));
    for (const key of missingInA) {
      console.log(`  ${c.yellow('-')} ${key}`);
    }
    hasErrors = true;
  }

  return hasErrors;
}

export function renderSuccess({ profileAName, profileBName }) {
  console.log('');
  console.log(c.green(t('success.ok', { a: profileAName, b: profileBName })));
}

export function renderError(message) {
  console.error('');
  console.error(c.red(`${t('error.prefix')} ${message}`));
}

export function renderWarning(message) {
  console.log('');
  console.log(c.yellow(`${t('warning.prefix')} ${message}`));
}

export function renderInfo(message) {
  console.log(c.dim(message));
}

export function renderPrompt(question) {
  return `${c.bold(question)} `;
}
