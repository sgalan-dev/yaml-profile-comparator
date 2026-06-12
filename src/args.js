export function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    basePath: null,
    profileAPath: null,
    profileBPath: null,
    yes: false,
    help: false,
    hasAnyFlag: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--base-path':
        flags.basePath = args[++i];
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

export function printHelp() {
  const lines = [
    'yaml-profile-comparator',
    '',
    'Compara dos archivos YAML de Spring Boot para detectar claves presentes en un',
    'perfil y ausentes en el otro. Por defecto abre un TUI que guia la eleccion de',
    'archivos; con flags ejecuta sin prompts.',
    '',
    'Uso:',
    '  node src/index.js [flags]',
    '',
    'Flags:',
    '  --base-path <abs>         Ruta absoluta al application.yml (o .yaml) base.',
    '                            Opcional. Si se omite o el archivo no existe, se',
    '                            comparan los perfiles sin base.',
    '  --profile-a-path <abs>    Ruta absoluta al archivo del perfil A.',
    '  --profile-b-path <abs>    Ruta absoluta al archivo del perfil B.',
    '  -y, --yes                 Saltea la confirmacion final del resumen.',
    '  -h, --help                Muestra esta ayuda.',
    '',
    'Salida: exit 0 si las estructuras coinciden, 1 si hay divergencias o error.',
    '',
    'Nota: se soportan extensiones .yml y .yaml en cualquier combinacion.',
    '',
    'BREAKING: los flags antiguos --base, --profile-a, --profile-b ya no existen.',
    'Usar las variantes con sufijo -path que reciben la ruta completa al archivo.',
  ];
  console.log(lines.join('\n'));
}
