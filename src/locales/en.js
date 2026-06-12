export default {
  language: {
    question: 'Which language do you want to use?',
    optionEs: 'Español',
    optionEn: 'English',
  },
  workingDir: {
    message: 'Working directory: ({dir})',
  },
  yamlFile: {
    back: '<- Back',
    empty: '(this directory contains no .yml or .yaml files)',
    emptyA: '(this directory contains no .yml or .yaml files for Profile A)',
    emptyB: '(this directory contains no .yml or .yaml files for Profile B)',
  },
  profileA: {
    label: 'Profile A',
  },
  profileB: {
    label: 'Profile B',
  },
  basePicker: {
    message: 'Several base files found, pick one:',
  },
  baseMissingWarning: 'no application.yml or application.yaml found in {dir}; comparing without a base file',
  summary: {
    title: 'File summary',
    noBase: '(no base file)',
  },
  confirm: {
    continue: 'Continue with the comparison?',
    cancelled: 'Cancelled by user.',
  },
  diff: {
    title: 'Comparison result',
    missingInB: ({ a, b }) => `Properties in [${a}] missing in [${b}]:`,
    missingInA: ({ a, b }) => `Properties in [${b}] missing in [${a}]:`,
  },
  success: {
    ok: ({ a, b }) => `OK: ${a} and ${b} have exactly the same property structure.`,
  },
  error: {
    prefix: 'Error:',
  },
  warning: {
    prefix: 'Warning:',
  },
  interrupted: 'Interrupted by user.',
};
