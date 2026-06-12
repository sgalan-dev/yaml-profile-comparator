#!/usr/bin/env node
import path from 'node:path';
import { parseArgs, printHelp } from './args.js';
import { runInteractive } from './interactive.js';
import { loadYamlOptional, validateFile, fileExists } from './loader.js';
import { mergeDeep } from './merge.js';
import { flatten } from './flatten.js';
import { diffKeys } from './diff.js';
import * as r from './render.js';

function displayName(filePath) {
  if (!filePath) return 'base';
  const base = path.basename(filePath, path.extname(filePath));
  return base === 'application' ? 'base' : base;
}

function resolveFromFlags(flags) {
  if (!flags.profileAPath || !flags.profileBPath) {
    r.renderError('En modo flags --profile-a-path y --profile-b-path son obligatorios.');
    printHelp();
    process.exit(1);
  }

  let basePath = null;
  if (flags.basePath) {
    if (fileExists(flags.basePath)) {
      basePath = path.resolve(flags.basePath);
    } else {
      r.renderWarning(`No se encontro ${flags.basePath}. Se compararan los perfiles sin base.`);
      basePath = null;
    }
  }

  const profileAPath = path.resolve(flags.profileAPath);
  const profileBPath = path.resolve(flags.profileBPath);

  return {
    basePath,
    profileAPath,
    profileBPath,
    profileAName: displayName(profileAPath),
    profileBName: displayName(profileBPath),
  };
}

function runComparison({ basePath, profileAPath, profileBPath, profileAName, profileBName }) {
  if (basePath) validateFile(basePath, 'application.yml base');
  validateFile(profileAPath, `perfil A (${profileAName})`);
  validateFile(profileBPath, `perfil B (${profileBName})`);

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

  if (resolved.cancelled) {
    process.exit(0);
  }

  const code = runComparison(resolved);
  process.exit(code);
}

process.on('uncaughtException', (e) => {
  r.renderError(`Error inesperado: ${e && e.message ? e.message : String(e)}`);
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  const msg = e && e.message ? e.message : String(e);
  if (/User force closed the prompt|User force closed|AbortError|SIGINT/i.test(msg)) {
    return;
  }
  r.renderError(`Promesa rechazada no manejada: ${msg}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  r.renderInfo('Interrumpido por el usuario.');
  process.exit(130);
});
process.on('SIGTERM', () => {
  r.renderInfo('Interrumpido por el usuario.');
  process.exit(143);
});

main();
