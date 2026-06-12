# yaml-profile-comparator

Utilidad de línea de comandos que compara dos archivos `application-{perfil}.yml` de Spring Boot para detectar claves presentes en un perfil y ausentes en el otro.

Es una herramienta para el desarrollador, **no una dependencia del proyecto Spring**. Vive en una carpeta propia y se lanza desde el terminal.

## Instalación

```bash
git clone <repo> yaml-profile-comparator
cd yaml-profile-comparator
npm install
```

Requiere Node.js >= 16.

## Uso interactivo

```bash
node src/index.js
```

El programa preguntará:

1. Ruta al `application.yml` base (Enter para omitir).
2. Si la base existe: ¿los `application-{perfil}.yml` están en la misma carpeta?
3. Nombre del perfil A y del perfil B.
4. Resumen de las 3 rutas finales y confirmación.

Si la base no existe, salta a pedir la ruta completa de ambos perfiles y los compara directamente.

## Uso con flags (no interactivo)

```bash
# Con base, perfiles en la misma carpeta
node src/index.js \
  --base /ruta/a/mi-app/src/main/resources/application.yml \
  --profile-a dev \
  --profile-b prod

# Con base, perfiles en carpetas distintas
node src/index.js \
  --base /ruta/a/application.yml \
  --profile-a dev \
  --profile-a-path /ruta/a/config/dev \
  --profile-b prod \
  --profile-b-path /ruta/a/config/prod

# Sin base, ambos perfiles con ruta explícita
node src/index.js \
  --profile-a dev \
  --profile-a-path /ruta/a/config \
  --profile-b prod \
  --profile-b-path /ruta/a/config
```

Flags disponibles:

| Flag | Descripción |
|---|---|
| `--base <ruta>` | Ruta al `application.yml`. Opcional. |
| `--profile-a <nombre>` | Nombre del perfil A. |
| `--profile-b <nombre>` | Nombre del perfil B. |
| `--profile-a-path <dir>` | Carpeta del perfil A. Si se omite y hay `--base`, se usa la carpeta de `--base`. |
| `--profile-b-path <dir>` | Carpeta del perfil B. Idem. |
| `-y`, `--yes` | Saltea la confirmación final. |
| `-h`, `--help` | Muestra la ayuda. |

## Códigos de salida

- `0` — las estructuras coinciden.
- `1` — hay divergencias, archivo no encontrado, YAML inválido, o error inesperado.

## Alcance y limitaciones

- **Solo compara la presencia de claves**, no sus valores ni sus tipos. `port: "8080"` y `port: 8080` cuentan como coincidentes.
- **Deep merge** perfil-sobre-base con arrays reemplazados en bloque (no se concatenan). Coincide con el comportamiento habitual de Spring Boot.
- **Extensión fijada en `.yml`**. No se intenta `.yaml` como alternativa.
- **No soporta** `spring.profiles.include`, `spring.config.activate.on-profile` ni `spring.config.import`. Solo lee los archivos nombrados explícitamente.
- **No se valida corrección en runtime** contra `@ConfigurationProperties`. Es un check declarativo de cobertura entre archivos.
- **No se distribuye como binario ni como paquete npm**. Es un proyecto local del desarrollador.
