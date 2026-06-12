const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { renderError } = require('./render');

function fileExists(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (_) {
    return false;
  }
}

function loadYamlOptional(filePath) {
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

function validateFile(filePath, label) {
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

function dirnameOf(filePath) {
  return path.dirname(path.resolve(filePath));
}

module.exports = { loadYamlOptional, validateFile, fileExists, dirnameOf };
