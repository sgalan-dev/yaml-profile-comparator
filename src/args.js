function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    base: null,
    profileA: null,
    profileB: null,
    profileAPath: null,
    profileBPath: null,
    yes: false,
    help: false,
    hasAnyFlag: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--base':
        flags.base = args[++i];
        flags.hasAnyFlag = true;
        break;
      case '--profile-a':
        flags.profileA = args[++i];
        flags.hasAnyFlag = true;
        break;
      case '--profile-b':
        flags.profileB = args[++i];
        flags.hasAnyFlag = true;
        break;
      case '--profile-a-path':
        flags.profileAPath = args[++i];
        flags.hasAnyFlag = true;
        break;
      case '--profile-b-path':
        flags.profileBPath = args[++i];
        flags.hasAnyFlag = true;
        break;
      case '-y':
      case '--yes':
        flags.yes = true;
        flags.hasAnyFlag = true;
        break;
      case '-h':
      case '--help':
        flags.help = true;
        flags.hasAnyFlag = true;
        break;
      default:
        flags.hasAnyFlag = true;
        break;
    }
  }
  return flags;
}

function printHelp() {
  const lines = [
    'yaml-profile-comparator',
    '',
    'Compara dos archivos application-<perfil>.yml de Spring Boot para detectar claves',
    'presentes en un perfil y ausentes en el otro. Por defecto pregunta todo en modo',
    'interactivo; con flags ejecuta sin prompts.',
    '',
    'Uso:',
    '  node src/index.js [flags]',
    '',
    'Flags:',
    '  --base <ruta>             Ruta al application.yml (opcional). Si se omite o el',
    '                            archivo no existe, se comparan los perfiles sin base.',
    '  --profile-a <nombre>      Nombre del perfil A (ej: dev).',
    '  --profile-b <nombre>      Nombre del perfil B (ej: prod).',
    '  --profile-a-path <dir>    Carpeta del perfil A. Si no se da y hay --base, se usa',
    '                            la carpeta de --base.',
    '  --profile-b-path <dir>    Carpeta del perfil B. Idem.',
    '  -y, --yes                 Saltea la confirmacion final del resumen.',
    '  -h, --help                Muestra esta ayuda.',
    '',
    'Salida: exit 0 si las estructuras coinciden, 1 si hay divergencias o error.',
    '',
    'Nota: la extension es siempre .yml (no se intenta .yaml).',
  ];
  console.log(lines.join('\n'));
}

module.exports = { parseArgs, printHelp };
