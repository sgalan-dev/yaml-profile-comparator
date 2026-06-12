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
    back: '<- Volver',
    empty: '(este directorio no contiene archivos .yml o .yaml)',
    emptyA: '(este directorio no contiene archivos .yml o .yaml para Profile A)',
    emptyB: '(este directorio no contiene archivos .yml o .yaml para Profile B)',
  },
  profileA: {
    label: 'Profile A',
  },
  profileB: {
    label: 'Profile B',
  },
  basePicker: {
    message: 'Varios archivos base posibles, elige uno:',
  },
  baseMissingWarning: 'no se encontró application.yml ni application.yaml en {dir}; se comparará sin archivo base',
  summary: {
    title: 'Resumen de archivos',
    noBase: '(sin archivo base)',
  },
  confirm: {
    continue: '¿Continuar con la comparación?',
    cancelled: 'Cancelado por el usuario.',
  },
  diff: {
    title: 'Resultado de la comparación',
    missingInB: ({ a, b }) => `Propiedades en [${a}] ausentes en [${b}]:`,
    missingInA: ({ a, b }) => `Propiedades en [${b}] ausentes en [${a}]:`,
  },
  success: {
    ok: ({ a, b }) => `OK: ${a} y ${b} tienen exactamente la misma estructura de propiedades.`,
  },
  error: {
    prefix: 'Error:',
  },
  warning: {
    prefix: 'Aviso:',
  },
  interrupted: 'Interrumpido por el usuario.',
};
