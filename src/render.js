import * as c from './colors.js';

export function renderHeader(title) {
  console.log('');
  console.log(c.bold(c.blue(title)));
  console.log(c.dim('-'.repeat(title.length)));
}

export function renderSummary(resolved) {
  renderHeader('Resumen de archivos');
  if (resolved.base) {
    console.log(`  ${c.bold('base')}  -> ${c.blue(resolved.base)}`);
  } else {
    console.log(`  ${c.bold('base')}  -> ${c.dim('(sin archivo base)')}`);
  }
  console.log(`  ${c.bold(resolved.profileAName)} -> ${c.blue(resolved.profileA)}`);
  console.log(`  ${c.bold(resolved.profileBName)} -> ${c.blue(resolved.profileB)}`);
}

export function renderDiff({ profileAName, profileBName, missingInB, missingInA }) {
  console.log('');
  console.log(c.bold('Resultado de la comparacion'));
  console.log(c.dim('---------------------------'));

  let hasErrors = false;

  if (missingInB.length > 0) {
    console.log('');
    console.log(c.red(`Propiedades en [${profileAName}] ausentes en [${profileBName}]:`));
    for (const key of missingInB) {
      console.log(`  ${c.red('-')} ${key}`);
    }
    hasErrors = true;
  }

  if (missingInA.length > 0) {
    console.log('');
    console.log(c.yellow(`Propiedades en [${profileBName}] ausentes en [${profileAName}]:`));
    for (const key of missingInA) {
      console.log(`  ${c.yellow('-')} ${key}`);
    }
    hasErrors = true;
  }

  return hasErrors;
}

export function renderSuccess({ profileAName, profileBName }) {
  console.log('');
  console.log(c.green(`OK: ${profileAName} y ${profileBName} tienen exactamente la misma estructura de propiedades.`));
}

export function renderError(message) {
  console.error('');
  console.error(c.red(`Error: ${message}`));
}

export function renderWarning(message) {
  console.log('');
  console.log(c.yellow(`Aviso: ${message}`));
}

export function renderInfo(message) {
  console.log(c.dim(message));
}

export function renderPrompt(question) {
  return `${c.bold(question)} `;
}
