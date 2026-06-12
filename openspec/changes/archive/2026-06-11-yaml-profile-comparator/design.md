## Context

El desarrollador trabaja con múltiples proyectos Spring Boot. Cada proyecto tiene un `application.yml` base y N archivos `application-{perfil}.yml`. Hoy no existe una forma rápida de validar que dos perfiles cubren las mismas propiedades, lo que provoca bugs cuando se olvida sobrescribir una clave en uno de los entornos.

La herramienta debe:

- Vivir **fuera** de cualquier proyecto Spring (utilidad del dev, no dependencia).
- Ser **portable** entre Windows, Linux y macOS.
- Funcionar en el **terminal integrado de VSCode** y terminales modernos.
- Permitir uso ad-hoc (modo interactivo) y uso en scripts/CI (modo flags).

## Goals / Non-Goals

**Goals:**

- Cargar y fusionar `application.yml` + dos `application-{perfil}.yml` simulando el comportamiento de Spring Boot (deep merge, perfil gana sobre base).
- Comparar la estructura de claves (dot-notation) entre los dos perfiles fusionados.
- Operar en modo interactivo y en modo flags con la misma lógica de negocio.
- Mostrar salida legible con códigos ANSI, sin emojis.
- Terminar con exit code 0 (sin divergencias) o 1 (con divergencias).
- Abortar con mensaje claro si algún archivo referenciado no existe o no parsea.

**Non-Goals:**

- No se valida corrección en runtime de propiedades (no se cruza con `@ConfigurationProperties` ni con el classpath de Spring).
- No se soportan `spring.profiles.include`, `spring.config.activate.on-profile` ni `spring.config.import`. Solo se leen los archivos nombrados explícitamente.
- No se intenta `.yaml` como alternativa a `.yml`. Extensión fijada.
- No se distribuye como paquete npm publicado, binario compilado, ni hook de Git. El dev lo clona/ejecuta localmente.
- No se incluye integración con CI concreta (GitHub Actions, GitLab, Jenkins). El exit code es el contrato; el pipeline lo decide el usuario.
- No se compara el contenido/valor de las claves, solo su presencia. (Una clave en ambos perfiles con valores distintos se considera coincidente.)

## Decisions

### 1. Lenguaje: Node.js + `js-yaml`

- **Por qué**: portabilidad inmediata, sin toolchain de compilación, `js-yaml` es la lib canónica de YAML en el ecosistema Node, sintaxis clara para deep merge y flatten recursivo. El spec inicial del usuario lo sugería.
- **Alternativas consideradas**:
  - Python + PyYAML: descartado por fricción en Windows (depende de instalación previa o Microsoft Store).
  - Go binario: descartado por requerir toolchain de build para distribuir.
  - JBang / Kotlin script: descartado por requerir JBang instalado, menos ubicuo.
  - Bash + `yq`: descartado por dependencia externa no estándar.

### 2. Empaquetado: carpeta con `package.json` + un script principal

- **Por qué**: dependencias declaradas, replicable, `npm install` es trivial. No se necesita publicación a npm.
- **Estructura**:
  ```
  yaml-profile-comparator/
  ├── package.json
  └── src/
      ├── index.js          # entrypoint, parseo de args
      ├── interactive.js    # flujo de preguntas con readline
      ├── merge.js          # deep merge de objetos
      ├── flatten.js        # aplanado a dot-notation
      ├── diff.js           # comparación de conjuntos de claves
      ├── render.js         # salida con colores ANSI
      └── colors.js         # helper de colores con detección de TTY
  ```
- **Alternativa considerada**: un único `compare.js` con todo inline. Descartado por peor legibilidad y testeabilidad, aunque es defendible para una primera versión. Se prefiere la estructura modular.

### 3. Modo dual: interactivo por defecto, flags como atajo

- **Por qué**: el caso de uso principal es el dev sentado frente al terminal. Pero los flags permiten uso en CI y alias de shell.
- **Comportamiento**: si se pasa cualquier flag, se entra en modo no interactivo. Si no, se inicia el flujo de preguntas.
- **Flags**:
  ```
  --base <ruta>            ruta al application.yml (opcional)
  --profile-a <nombre>     nombre del perfil A (requerido en modo flags)
  --profile-b <nombre>     nombre del perfil B (requerido en modo flags)
  --profile-a-path <dir>   directorio del perfil A (opcional, default = dir de --base)
  --profile-b-path <dir>   directorio del perfil B (opcional, default = dir de --base)
  --yes / -y               saltar confirmación del resumen
  --help / -h              mostrar ayuda
  ```
- **Resolución de rutas en modo flags**:
  - Si `--base` no se da → modo "sin base", `--profile-a-path` y `--profile-b-path` son obligatorios y deben apuntar a directorios (no a archivos), porque la herramienta concatena `application-{nombre}.yml` por convención.
  - Si `--base` se da y el archivo existe → modo "con base". `--profile-a-path`/`--profile-b-path` caen a la carpeta de `--base` si no se indican.
  - Si `--base` se da pero el archivo no existe → modo "sin base" (mismo comportamiento que el modo interactivo: no abortar, continuar y pedir ambas rutas).

### 4. Modo interactivo: readline con preguntas secuenciales + validación

- **Por qué**: `readline` viene en la stdlib de Node, no añade dependencias, y encaja con el estilo "responde y avanza".
- **Preguntas**:
  1. Ruta al `application.yml` base. Acepta `Enter` para omitir.
  2. Si el archivo existe: ¿"misma carpeta"? Si S → pide perfil A y perfil B. Si N → pide (ruta A, perfil A) y (ruta B, perfil B).
  3. Si el archivo no existe: mostrar aviso, pedir (ruta A, perfil A) y (ruta B, perfil B) directamente.
- **Confirmación final**: siempre se muestra un resumen con las 3 rutas finales coloreadas y se pide confirmación. Salteable con `--yes`.
- **Validación**: si la ruta no existe o no es un archivo `.yml` regular, se repregunta (no se aborta en seco; se da la oportunidad de corregir el typo). El caso de "archivo de perfil confirmado por el usuario pero inexistente al validar" sí aborta con mensaje claro.

### 5. Colores: helper casero con detección de TTY, sin librerías

- **Por qué**: cero dependencias extra, portabilidad adecuada para VSCode/Windows Terminal/iTerm (todos TTY), degradación razonable en `cmd.exe` legacy.
- **Helper `colors.js`**:
  ```js
  const useColor = process.stdout.isTTY === true;
  const wrap = (code) => (s) => useColor ? `\x1b[${code}m${s}\x1b[0m` : s;
  module.exports = {
    red:    wrap('31'),
    green:  wrap('32'),
    yellow: wrap('33'),
    blue:   wrap('34'),
    bold:   wrap('1'),
    dim:    wrap('2'),
  };
  ```
- **Paleta**:
  - Títulos de sección: `bold` + color
  - "Faltan en perfil B": `red`
  - "Faltan en perfil A": `yellow` (asimétrico: B es el "objetivo" típico en migraciones dev→prod, pero se documenta que ambos lados se colorean igual de prominentes)
  - "Sin divergencias": `green`
  - Rutas en el resumen: `blue`
  - Avisos no fatales: `yellow`

### 6. Deep merge: recursivo, perfil gana sobre base

- **Implementación**: `mergeDeep(base, override)` con la regla:
  - Si la clave en `override` es objeto plain y en `base` también objeto plain → recursión.
  - Si la clave en `override` es objeto plain pero en `base` no → se toma `override` tal cual.
  - En cualquier otro caso → `override` reemplaza.
- **Detección de "objeto plain"**: `typeof === 'object' && !Array.isArray(item) && item !== null`. Los arrays NO se fusionan: el del perfil reemplaza al de la base. Esto coincide con el comportamiento de Spring Boot (`@ConfigurationProperties` no hace merge de listas en `Map`-style; el perfil sobrescribe).
- **Manejo de `null`**: un `null` explícito en el perfil elimina el valor de la base. La flatten lo trata como nodo terminal (no recursión), por lo que `spring.datasource.password: null` aparece como clave presente.

### 7. Flatten: dot-notation estándar de Spring

- Recorre recursivamente el objeto fusionado.
- Para cada objeto: itera claves, concatena con `.` y desciende.
- Para arrays: itera índices como segmentos (`app.endpoints.0`, `app.endpoints.1`).
- Para valores terminales (no objeto/array, incluido `null`): emite la clave completa.
- Resultado: `Set<string>` (o array) de claves únicas en formato `padre.hijo.nieto`.

### 8. Diff: diferencia de conjuntos sobre las claves planas

- `missingInB = keysA \ keysB`
- `missingInA = keysB \ keysA`
- Si ambos están vacíos → exit 0, mensaje de éxito.
- Si alguno no está vacío → exit 1, listar ambos grupos.

### 9. Manejo de errores de parseo YAML

- Si `js-yaml` lanza al parsear cualquier archivo → abortar con `process.exit(1)` y mensaje en `red` indicando el archivo y la línea (js-yaml incluye posición en el error). No se intenta recuperación parcial.

## Risks / Trade-offs

- **Sin soporte para `spring.profiles.include` / `spring.config.import`** → el script no detecta configuraciones compuestas. Si un proyecto usa imports, la herramienta dará falsos positivos o negativos. [Mitigation: documentar en el `--help` y en el README que el alcance es solo archivos nombrados explícitamente.]

- **Comparación solo de presencia, no de tipo ni de valor** → claves con tipos distintos (`port: "8080"` vs `port: 8080`) cuentan como coincidentes. [Mitigation: documentar la limitación. Mejorar en una versión futura si el usuario lo pide.]

- **Deep merge "naive"** → no se ajusta al 100% al comportamiento de Spring en casos extremos (listas vs mapas, anclas/aliases YAML). [Mitigation: el caso de uso es 95% keys con valores escalares y maps anidados. Para el resto, el script es aproximado, no una simulación exacta. Documentar.]

- **Detección de TTY puede fallar en wrappers raros** → pipes, redirecciones, etc. donde `isTTY` es false. [Mitigation: en modo no interactivo (flags), los colores se desactivan automáticamente, que es lo que se quiere. En modo interactivo no se da el caso.]

- **Windows `cmd.exe` legacy no soporta ANSI nativamente** → los códigos se imprimen como texto raro. [Mitigation: el usuario objetivo es VSCode integrado y Windows Terminal, ambos TTY. Si alguien lo corre en `cmd.exe` legacy, los códigos aparecen como `\x1b[31m...` que es feo pero no roto. Sin librería chalk para no añadir dependencia.]

- **No se distribuyen tests automatizados en esta versión** → confiamos en prueba manual con casos representativos. [Mitigation: documentar 3-4 casos de prueba canónicos en `README.md` para validación rápida. Tests formales se pueden añadir en una iteración posterior.]

- **Modo interactivo lee stdin, no apt para CI sin `--yes` + flags** → [Mitigation: documentar claramente en `--help` que CI debe usar flags. La lógica ya está prevista.]

## Open Questions

- ¿Queremos añadir un flag `--quiet` para que en éxito no imprima nada (solo exit code)? Útil en CI para no llenar logs. Decisión pospuesta: añadir si el usuario lo pide, no es bloqueante.
- ¿Queremos un flag `--format json` para emitir el diff como JSON (más amigable a herramientas externas)? Decisión pospuesta.
- ¿El script debe recordar la última ruta usada (un `.yaml-profile-comparatorrc` en cwd)? Decisión pospuesta; complica la primera versión.
