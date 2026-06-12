const readline = require('readline');
const path = require('path');
const { fileExists, dirnameOf } = require('./loader');
const r = require('./render');
const c = require('./colors');

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(r.renderPrompt(question), (answer) => resolve(answer.trim()));
  });
}

function confirm(rl, question) {
  return ask(rl, question).then((a) => {
    const v = a.toLowerCase();
    return v === 's' || v === 'si' || v === 'y' || v === 'yes' || v === '';
  });
}

async function runInteractive({ skipFinalConfirm }) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    r.renderInfo('Modo interactivo. Responde las preguntas para configurar la comparacion.');
    console.log('');

    const basePathRaw = await ask(rl, 'Ruta al application.yml base (Enter para omitir):');
    const basePath = basePathRaw || null;
    let mode;
    let baseDir = null;
    let baseExists = false;

    if (basePath) {
      baseExists = fileExists(basePath);
      if (baseExists) {
        baseDir = dirnameOf(basePath);
        const same = await confirm(rl, 'Los application-<perfil>.yml estan en la misma carpeta? [S/n]');
        mode = same ? 'same' : 'split';
      } else {
        r.renderWarning(`No se encontro ${basePath}. Se compararan los perfiles sin base.`);
        mode = 'noBase';
      }
    } else {
      r.renderWarning('No se proporciono application.yml. Se compararan los perfiles sin base.');
      mode = 'noBase';
    }

    let profileAPath, profileBPath, profileAPathRaw, profileBPathRaw;
    let profileAName, profileBName;

    if (mode === 'same') {
      profileAName = await ask(rl, 'Nombre del perfil A (ej: dev):');
      profileBName = await ask(rl, 'Nombre del perfil B (ej: prod):');
      profileAPath = path.join(baseDir, `application-${profileAName}.yml`);
      profileBPath = path.join(baseDir, `application-${profileBName}.yml`);
    } else if (mode === 'split') {
      profileAPathRaw = await ask(rl, 'Carpeta del perfil A:');
      profileBPathRaw = await ask(rl, 'Carpeta del perfil B:');
      profileAName = await ask(rl, 'Nombre del perfil A (ej: dev):');
      profileBName = await ask(rl, 'Nombre del perfil B (ej: prod):');
      profileAPath = path.join(path.resolve(profileAPathRaw), `application-${profileAName}.yml`);
      profileBPath = path.join(path.resolve(profileBPathRaw), `application-${profileBName}.yml`);
    } else {
      profileAPathRaw = await ask(rl, 'Ruta completa al archivo del perfil A:');
      profileBPathRaw = await ask(rl, 'Ruta completa al archivo del perfil B:');
      profileAPath = path.resolve(profileAPathRaw);
      profileBPath = path.resolve(profileBPathRaw);
      profileAName = path.basename(profileAPath).replace(/^application-/, '').replace(/\.yml$/, '');
      profileBName = path.basename(profileBPath).replace(/^application-/, '').replace(/\.yml$/, '');
    }

    r.renderSummary({
      base: baseExists ? path.resolve(basePath) : null,
      profileA: profileAPath,
      profileB: profileBPath,
      profileAName,
      profileBName,
    });

    if (!skipFinalConfirm) {
      const ok = await confirm(rl, 'Continuar con la comparacion? [S/n]');
      if (!ok) {
        r.renderInfo('Cancelado por el usuario.');
        rl.close();
        process.exit(0);
      }
    }

    return {
      basePath: baseExists ? path.resolve(basePath) : null,
      profileAPath,
      profileBPath,
      profileAName: profileAName || 'A',
      profileBName: profileBName || 'B',
    };
  } finally {
    rl.close();
  }
}

module.exports = { runInteractive };
