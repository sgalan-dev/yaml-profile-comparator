import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { renderError } from './render.js';

export function fileExists(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (_) {
    return false;
  }
}

export function loadYamlOptional(filePath) {
  if (!fileExists(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(content);
    return parsed === null || parsed === undefined ? {} : parsed;
  } catch (e) {
    renderError(`No se pudo parsear el archivo YAML: ${filePath}`);
    console.error(e.message || String(e));
    process.exit(1);
  }
}

export function validateFile(filePath, label) {
  if (!filePath) {
    renderError(`No se proporciono ruta para ${label}.`);
    process.exit(1);
  }
  if (!fileExists(filePath)) {
    renderError(`Archivo no encontrado: ${filePath} (${label})`);
    process.exit(1);
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    yaml.load(content);
  } catch (e) {
    renderError(`YAML invalido en ${filePath} (${label})`);
    console.error(e.message || String(e));
    process.exit(1);
  }
}

export function dirnameOf(filePath) {
  return path.dirname(path.resolve(filePath));
}

const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);

function isYmlName(name) {
  if (!name || name.startsWith('.')) return false;
  return YAML_EXTENSIONS.has(path.extname(name).toLowerCase());
}

export function listYmlFiles(dir) {
  const absDir = path.resolve(dir);
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch (_) {
    return [];
  }
  const files = entries
    .filter((e) => e.isFile() && isYmlName(e.name))
    .map((e) => path.join(absDir, e.name));
  files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return files;
}

export function findBaseCandidates(dir) {
  const absDir = path.resolve(dir);
  const out = [];
  for (const name of ['application.yml', 'application.yaml']) {
    const candidate = path.join(absDir, name);
    if (fileExists(candidate)) {
      out.push(candidate);
    }
  }
  return out;
}
