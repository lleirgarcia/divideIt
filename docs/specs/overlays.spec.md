# Sistema de overlays de animacion

## Proposito

Superponer un video de animacion en bucle (juego, efecto visual) sobre un clip procesado. El sistema debe soportar multiples overlays distintos y ser configurable por llamada, no hardcodeado.

## Assets disponibles

| Nombre          | Archivo                    | Estado     |
|-----------------|----------------------------|------------|
| space_invaders  | `assets/space_invaders_loop.mp4` | Activo     |
| pacman          | `assets/pacman_loop.mp4`         | Asset listo, sin conectar |
| attention       | `assets/attention_loop.mp4`      | Asset listo, sin conectar |

## Interfaz publica

```typescript
type OverlayName = 'space_invaders' | 'pacman' | 'attention' | 'none';

// Funcion principal
addGameOverlayToVideo(
  inputPath: string,
  outputPath: string,
  overlay?: OverlayName  // default: 'space_invaders'
): Promise<string>

// Integracion en el pipeline
splitVideo(inputPath, outputDir, segments, {
  outputFormat: 'vertical' | 'horizontal',
  overlay: OverlayName  // default: 'space_invaders'
})
```

## Comportamiento esperado

### Seleccion de overlay
- Si `overlay` es `'none'`, no se aplica ningun overlay. El clip se devuelve sin modificar.
- Si `overlay` no se especifica, se usa `'space_invaders'` por defecto.
- Si el asset del overlay especificado no existe en disco, la funcion lanza un error descriptivo indicando el nombre del asset y como generarlo.

### Aplicacion del overlay
- El overlay se escala para ocupar la banda inferior del video segun las ratios configuradas.
- El overlay se reproduce en bucle durante toda la duracion del clip principal (`-stream_loop -1`).
- La duracion del output es igual a la del clip principal (no mas, no menos).
- El video principal no se recorta ni deforma.
- El audio del clip principal se conserva. El overlay no tiene audio propio que mezclar.

### Escritura segura
- FFmpeg escribe primero a un fichero temporal `tmp_<nombre>.mp4`.
- Solo si FFmpeg termina con exit code 0 Y ffprobe valida que el output tiene video y duracion > 0, se renombra al path final.
- Si FFmpeg falla o el output es invalido, se elimina el temporal y se lanza un error. El fichero original no se modifica.

### Progreso
- El progreso se reporta en intervalos del 10% a traves del logger y console.log.

### Codec
- Siempre se usa `libx264` (no VideoToolbox ni otros aceleradores hardware) para garantizar compatibilidad y evitar corrupcion.
- Preset: `ultrafast`, CRF: 23, threads: 1, pix_fmt: yuv420p.

## Casos de error

| Situacion                              | Comportamiento esperado                          |
|----------------------------------------|--------------------------------------------------|
| Asset de overlay no encontrado         | Error con mensaje indicando el asset y el comando para generarlo |
| FFmpeg termina con codigo != 0         | Error con las ultimas 25 lineas de stderr        |
| Output temporal invalido (sin moov)    | Error indicando que el MP4 esta incompleto. Original sin tocar. |
| Proceso FFmpeg matado (SIGKILL)        | Error con sugerencia de ejecutar en terminal nativo |

## Pendiente / fuera de scope

- Overlays en posicion distinta a la banda inferior.
- Mezcla de audio del overlay con el audio del clip.
- Multiples overlays simultaneos en un mismo clip.
- Generacion procedural de overlays (los assets son videos pre-renderizados).
