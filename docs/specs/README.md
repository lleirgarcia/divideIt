# Specs — divideIt

## Que es esto

Cada fichero `.spec.md` describe el comportamiento esperado de un modulo o feature **antes de implementarlo**.
Los tests de Jest/Playwright se escriben a partir de estas specs. La spec es la fuente de verdad.

## Flujo de trabajo

```
1. Nueva feature → crear o editar el .spec.md correspondiente
2. Definir: entradas, salidas, comportamiento, casos de error
3. Escribir los tests (describe/it) derivados de la spec
4. Implementar hasta que los tests pasen
5. La spec + tests quedan como documentacion viva
```

## Estructura

```
docs/specs/
  README.md              <- este fichero
  pipeline.spec.md       <- pipeline completo de procesado de video
  overlays.spec.md       <- sistema de overlays de animacion
  formato-salida.spec.md <- formatos de salida (vertical 9:16 / horizontal 16:9)
  social-content.spec.md <- transcripcion, resumen y contenido social
  api.spec.md            <- contratos REST
```

## Plantilla de spec

```markdown
# Nombre del modulo

## Proposito
Una frase. Que hace este modulo y por que existe.

## Interfaz publica
Firma de la funcion/clase/endpoint que se esta especificando.

## Comportamiento esperado
Lista de comportamientos que deben cumplirse. Cada punto se convierte en un `it(...)` de Jest.

## Casos de error
Que debe ocurrir cuando algo falla. Como se propaga el error.

## Pendiente / fuera de scope
Lo que deliberadamente no hace este modulo.
```

## Convenios

- Las specs se escriben en **español**.
- El codigo (nombres de variables, funciones, tipos) se mantiene en **ingles**.
- Un `it(...)` por comportamiento especificado, no mas.
- Si un comportamiento no tiene test aun, usar `test.todo('descripcion')`.
- Los tests de integracion que necesiten FFmpeg o red se marcan con el grupo `@integration`.
