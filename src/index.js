const path = require('path');
const { parseArgs, printHelp } = require('./args');
const { runInteractive } = require('./interactive');
const { loadYamlOptional, validateFile, fileExists } = require('./loader');
const { mergeDeep } = require('./merge');
const { flatten } = require('./flatten');
const { diffKeys } = require('./diff');
const r = require('./render');
const c = require('./colors');

function resolveFromFlags(flags) {
  if (!flags.profileA || !flags.profileB) {
    r.renderError('En modo flags --profile-a y --profile-b son obligatorios.');
    printHelp();
    process.exit(1);
  }

  let basePath = null;
  let baseDir = null;
  let hasBase = false;

  if (flags.base) {
    if (fileExists(flags.base)) {
      basePath = path.resolve(flags.base);
      baseDir = path.dirname(basePath);
      hasBase = true;
    } else {
      r.renderWarning(`No se encontro ${flags.base}. Se compararan los perfiles sin base.`);
    }
  }

  let profileAPath, profileBPath;

  if (!hasBase) {
    if (!flags.profileAPath || !flags.profileBPath) {
      r.renderError('Sin --base valido, --profile-a-path y --profile-b-path son obligatorios.');
      printHelp();
      process.exit(1);
    }
    profileAPath = path.join(path.resolve(flags.profileAPath), `application-${flags.profileA}.yml`);
    profileBPath = path.join(path.resolve(flags.profileBPath), `application-${flags.profileB}.yml`);
  } else {
    const aDir = flags.profileAPath ? path.resolve(flags.profileAPath) : baseDir;
    const bDir = flags.profileBPath ? path.resolve(flags.profileBPath) : baseDir;
    profileAPath = path.join(aDir, `application-${flags.profileA}.yml`);
    profileBPath = path.join(bDir, `application-${flags.profileB}.yml`);
  }

  return {
    basePath,
    profileAPath,
    profileBPath,
    profileAName: flags.profileA,
    profileBName: flags.profileB,
  };
}

function runComparison({ basePath, profileAPath, profileBPath, profileAName, profileBName }) {
  if (basePath) validateFile(basePath, 'application.yml base');
  validateFile(profileAPath, `application-${profileAName}.yml`);
  validateFile(profileBPath, `application-${profileBName}.yml`);

  const base = basePath ? loadYamlOptional(basePath) : {};
  const a = loadYamlOptional(profileAPath);
  const b = loadYamlOptional(profileBPath);

  const fullA = basePath ? mergeDeep(base, a) : a;
  const fullB = basePath ? mergeDeep(base, b) : b;

  const keysA = flatten(fullA).sort();
  const keysB = flatten(fullB).sort();

  const { missingInB, missingInA } = diffKeys(keysA, keysB);
  const hasErrors = r.renderDiff({ profileAName, profileBName, missingInB, missingInA });

  if (!hasErrors) {
    r.renderSuccess({ profileAName, profileBName });
    return 0;
  }
  return 1;
}

async function main() {
  const flags = parseArgs(process.argv);

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  let resolved;

  if (flags.hasAnyFlag) {
    resolved = resolveFromFlags(flags);
  } else {
    resolved = await runInteractive({ skipFinalConfirm: flags.yes });
  }

  const code = runComparison(resolved);
  process.exit(code);
}

process.on('uncaughtException', (e) => {
  r.renderError(`Error inesperado: ${e && e.message ? e.message : String(e)}`);
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  r.renderError(`Promesa rechazada no manejada: ${e && e.message ? e.message : String(e)}`);
  process.exit(1);
});

main();
