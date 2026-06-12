const c = require('./colors');

function renderHeader(title) {
  console.log('');
  console.log(c.bold(c.blue(title)));
  console.log(c.dim('-'.repeat(title.length)));
}

function renderSummary(resolved) {
  renderHeader('Resumen de archivos');
  if (resolved.base) {
    console.log(`  ${c.bold('base')}  -> ${c.blue(resolved.base)}`);
  } else {
    console.log(`  ${c.bold('base')}  -> ${c.dim('(sin archivo base)')}`);
  }
  console.log(`  ${c.bold(resolved.profileAName)} -> ${c.blue(resolved.profileA)}`);
  console.log(`  ${c.bold(resolved.profileBName)} -> ${c.blue(resolved.profileB)}`);
}

function renderDiff({ profileAName, profileBName, missingInB, missingInA }) {
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

function renderSuccess({ profileAName, profileBName }) {
  console.log('');
  console.log(c.green(`OK: ${profileAName} y ${profileBName} tienen exactamente la misma estructura de propiedades.`));
}

function renderError(message) {
  console.error('');
  console.error(c.red(`Error: ${message}`));
}

function renderWarning(message) {
  console.log('');
  console.log(c.yellow(`Aviso: ${message}`));
}

function renderInfo(message) {
  console.log(c.dim(message));
}

function renderPrompt(question) {
  return `${c.bold(question)} `;
}

module.exports = {
  renderSummary,
  renderDiff,
  renderSuccess,
  renderError,
  renderWarning,
  renderInfo,
  renderPrompt,
};
