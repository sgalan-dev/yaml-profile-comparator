import fs from 'node:fs';
import path from 'node:path';
import { select, confirm } from '@inquirer/prompts';
import { listYmlFiles, findBaseCandidates } from './loader.js';
import { renderBanner } from './banner.js';
import { renderWarning, renderInfo, renderSummary } from './render.js';
import { promptTheme } from './theme.js';
import { t, setLocale } from './i18n.js';

const BACK = '__back__';
const STAY = '__stay__';

function listSubdirectories(dir) {
  const absDir = path.resolve(dir);
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch (_) {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => path.join(absDir, e.name))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export async function pickLanguage() {
  const choices = [
    { name: t('language.optionEs'), value: 'es' },
    { name: t('language.optionEn'), value: 'en' },
  ];
  return await select({
    message: t('language.question'),
    choices,
    pageSize: choices.length,
    theme: promptTheme,
  });
}

export async function pickWorkingDirectory(startDir) {
  let current = path.resolve(startDir);

  while (true) {
    const subs = listSubdirectories(current);
    const choices = [
      { name: './', value: STAY },
      { name: '../', value: path.dirname(current) },
      ...subs.map((d) => ({ name: `./${path.relative(current, d) || path.basename(d) + path.sep}`, value: d })),
    ];

    const picked = await select({
      message: t('workingDir.message', { dir: current }),
      choices,
      pageSize: Math.max(5, choices.length),
      theme: promptTheme,
    });

    if (picked === STAY) {
      return current;
    }
    current = picked;
  }
}

export async function pickYamlFile(dir, label) {
  const files = listYmlFiles(dir);
  const choices = [
    { name: t('yamlFile.back'), value: BACK },
    ...files.map((f) => ({ name: path.basename(f), value: f })),
  ];

  if (files.length === 0) {
    return {
      result: BACK,
      message: t('yamlFile.empty'),
    };
  }

  const picked = await select({
    message: `${label}: (working dir = ${dir})`,
    choices,
    pageSize: Math.max(5, choices.length),
    theme: promptTheme,
  });

  return { result: picked };
}

export async function pickBaseCandidate(candidates) {
  const choices = candidates.map((c) => ({ name: c, value: c }));
  return await select({
    message: t('basePicker.message'),
    choices,
    pageSize: Math.max(5, choices.length),
    theme: promptTheme,
  });
}

function displayName(filePath) {
  if (!filePath) return 'base';
  const base = path.basename(filePath, path.extname(filePath));
  return base === 'application' ? 'base' : base;
}

export async function runInteractive({ skipFinalConfirm }) {
  renderBanner();

  const pickedLang = await pickLanguage();
  setLocale(pickedLang);

  let workingDir;
  let profileAPath;
  let profileBPath;
  let basePath = null;

  while (true) {
    workingDir = await pickWorkingDirectory(process.cwd());

    const baseCandidates = findBaseCandidates(workingDir);
    if (baseCandidates.length === 0) {
      renderWarning(t('baseMissingWarning', { dir: workingDir }));
      basePath = null;
    } else if (baseCandidates.length === 1) {
      basePath = baseCandidates[0];
    } else {
      basePath = await pickBaseCandidate(baseCandidates);
    }

    let filePick;
    while (true) {
      filePick = await pickYamlFile(workingDir, t('profileA.label'));
      if (filePick.result === BACK) {
        if (filePick.message) renderInfo(filePick.message);
        break;
      }
      profileAPath = filePick.result;
      break;
    }
    if (profileAPath) {
      while (true) {
        filePick = await pickYamlFile(workingDir, t('profileB.label'));
        if (filePick.result === BACK) {
          if (filePick.message) renderInfo(filePick.message);
          break;
        }
        profileBPath = filePick.result;
        break;
      }
    }

    if (profileAPath && profileBPath) {
      break;
    }
  }

  const profileAName = displayName(profileAPath);
  const profileBName = displayName(profileBPath);

  renderSummary({
    base: basePath,
    profileA: profileAPath,
    profileB: profileBPath,
    profileAName,
    profileBName,
  });

  if (!skipFinalConfirm) {
    const ok = await confirm({
      message: t('confirm.continue'),
      default: true,
      theme: promptTheme,
    });
    if (!ok) {
      renderInfo(t('confirm.cancelled'));
      return { cancelled: true };
    }
  }

  return {
    basePath,
    profileAPath,
    profileBPath,
    profileAName,
    profileBName,
  };
}
