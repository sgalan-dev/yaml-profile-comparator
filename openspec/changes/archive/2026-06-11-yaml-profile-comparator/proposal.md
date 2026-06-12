## Why

En proyectos Spring Boot es habitual tener un `application.yml` base más un `application-{perfil}.yml` por entorno (dev, pre, prod, etc.). Es muy fácil olvidarse de sobrescribir una propiedad en uno de los perfiles y descubrirlo en producción, cuando ya es tarde. No existe hoy una utilidad rápida, portable y reutilizable que simule la fusión que hace Spring y avise de divergencias entre perfiles antes de que el bug llegue al entorno real.

## What Changes

- Se crea una nueva utilidad CLI llamada `yaml-profile-comparator` que vive **fuera de los proyectos Spring** (es una herramienta del desarrollador, no una dependencia).
- La utilidad carga `application.yml` (si existe) y dos `application-{perfil}.yml`, simula la fusión profunda que haría Spring Boot, aplana el resultado a notación de puntos y reporta las claves presentes en un perfil y ausentes en el otro.
- La utilidad funciona en modo **interactivo por defecto** (pregunta rutas, confirma perfil, muestra resumen, pide confirmación) y también acepta **flags** para ir directo a la ejecución.
- La salida por consola usa **colores ANSI** (sin emojis) y termina con **exit code 0** si las estructuras coinciden y **1** si hay divergencias (apto para CI).
- Los **archivos referenciados deben existir**; si falta alguno, la utilidad aborta con un mensaje claro en lugar de tratarlo como vacío silenciosamente.
- Se documenta el comportamiento en dos modos: **con base** (`application.yml` presente, perfiles en la misma carpeta o en carpetas distintas) y **sin base** (`application.yml` ausente, ambos perfiles con ruta completa explícita).
- Se fija la extensión `.yml` (no se intenta `.yaml` como fallback).

## Capabilities

### New Capabilities

- `profile-comparison`: Carga, fusión profunda, aplanamiento y comparación de propiedades entre dos perfiles Spring Boot a partir de sus archivos YAML, en modo interactivo o por flags, con salida coloreada y exit codes utilizables en CI.

### Modified Capabilities

(ninguna — no hay specs previos)

## Impact

- **Código nuevo**: un único proyecto Node.js autocontenido con `package.json` y un script principal.
- **Dependencias**: `js-yaml` (única dependencia de runtime). Node.js ≥ 16 asumido en la máquina del desarrollador.
- **Sistemas**: ninguno. No toca proyectos Spring, ni se integra con Maven/Gradle, ni se publica como paquete npm en esta versión.
- **Empaquetado / distribución**: el desarrollador lo clona o copia a una carpeta local y lo ejecuta con `node`. No se añade al PATH en esta versión.
- **CI**: el exit code 1 ante divergencias permite usarlo como gate, pero la integración con pipelines concretas queda fuera de scope.
