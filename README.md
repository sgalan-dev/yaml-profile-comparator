# yaml-profile-comparator

Utilidad de línea de comandos que compara dos archivos YAML de Spring Boot (`application-<perfil>.yml` o `application-<perfil>.yaml`) para detectar claves presentes en un perfil y ausentes en el otro.

Es una herramienta para el desarrollador, **no una dependencia del proyecto Spring**. Vive en una carpeta propia y se lanza desde el terminal.

## Instalación

```bash
git clone <repo> yaml-profile-comparator
cd yaml-profile-comparator
npm install
```

Requiere Node.js >= 18.

## Uso interactivo (TUI)

```bash
node src/index.js
```

Al arrancar sin flags se abre un TUI guiado por flechas y Enter. Los pasos son:

0. **Banner ASCII** con el título "yaml profile comparator" y la firma "sgalan.dev".
1. **Selector de idioma**: la primera pregunta es "Which language do you want to use?" con opciones `English` y `Español`. El idioma por defecto es inglés. Todo el TUI (prompts, summary, diff, success, warnings, Ctrl-C) se muestra en el idioma elegido. No se persiste entre invocaciones.
2. **Selector de directorio de trabajo**: arranca en `process.cwd()`. Las dos primeras opciones son siempre `./` (confirmar) y `../` (subir un nivel). El resto son los subdirectorios no ocultos, ordenados alfabéticamente.
3. **Selector del perfil A**: lista plana de `*.yml` y `*.yaml` del directorio elegido, con `← Volver` como primera opción para volver al selector de directorio.
4. **Selector del perfil B**: misma forma que el de A.
5. **Auto-detección del archivo base**: si existe `application.yml` o `application.yaml` en el directorio, se toma silenciosamente. Si existen ambos, se pregunta cuál usar. Si no hay ninguno, se imprime un aviso y se sigue sin base.
6. **Resumen final** con las tres rutas resueltas (o `(sin archivo base)` si corresponde) y un nombre legible derivado del nombre del archivo.
7. **Confirmación** "¿Continuar con la comparación?" con default "sí". Con `-y` / `--yes` se salta.

## Uso con flags (no interactivo)

```bash
# Con base, dos perfiles
node src/index.js -y \
  --base-path /ruta/a/mi-app/src/main/resources/application.yml \
  --profile-a-path /ruta/a/mi-app/src/main/resources/application-dev.yml \
  --profile-b-path /ruta/a/mi-app/src/main/resources/application-prod.yml

# Sin base, los dos perfiles con ruta explícita
node src/index.js -y \
  --profile-a-path /ruta/a/application-dev.yml \
  --profile-b-path /ruta/a/application-prod.yml

# Rutas relativas (se resuelven contra process.cwd())
node src/index.js -y \
  --profile-a-path ./application-dev.yml \
  --profile-b-path ./application-prod.yml
```

Flags disponibles:

| Flag | Descripción |
|---|---|
| `--base-path <abs>` | Ruta absoluta al `application.yml` o `application.yaml` base. Opcional. Si se omite o el archivo no existe, se comparan los perfiles sin base (y se imprime un aviso). |
| `--profile-a-path <abs>` | Ruta absoluta al archivo del perfil A. Obligatorio en modo flags. |
| `--profile-b-path <abs>` | Ruta absoluta al archivo del perfil B. Obligatorio en modo flags. |
| `-y`, `--yes` | Saltea la confirmación final. |
| `-h`, `--help` | Muestra la ayuda. |

**BREAKING** desde la versión 0.1: los flags antiguos `--base`, `--profile-a`, `--profile-b` ya no existen. Las variantes con sufijo `-path` reciben la ruta completa al archivo, no un nombre de perfil.

## Códigos de salida

- `0` — las estructuras coinciden.
- `1` — hay divergencias, archivo no encontrado, YAML inválido, o error inesperado.

## Alcance y limitaciones

- **Solo compara la presencia de claves**, no sus valores ni sus tipos. `port: "8080"` y `port: 8080` cuentan como coincidentes.
- **Deep merge** perfil-sobre-base con arrays reemplazados en bloque (no se concatenan). Coincide con el comportamiento habitual de Spring Boot.
- **Soporta `.yml` y `.yaml`** en cualquier combinación (auto-detección, validación, listado en el TUI).
- **No soporta** `spring.profiles.include`, `spring.config.activate.on-profile` ni `spring.config.import`. Solo lee los archivos nombrados explícitamente.
- **No se valida corrección en runtime** contra `@ConfigurationProperties`. Es un check declarativo de cobertura entre archivos.
- **El TUI requiere TTY.** En pipes o CI usar el modo con flags (`--profile-a-path`, `--profile-b-path`, etc.).
- **No se distribuye como binario ni como paquete npm**. Es un proyecto local del desarrollador.
