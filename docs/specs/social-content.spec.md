# Contenido social (transcripcion, resumen y redes sociales)

## Proposito

A partir de un clip de video, generar automaticamente los textos necesarios para publicarlo en redes sociales: transcripcion, subtitulos, resumen y contenido de publicacion (titulo + descripcion).

## Modulos implicados

- `transcriptionService` — transcribe audio a texto (Whisper)
- `summarizationService` — resume texto y genera contenido social (LLM)
- `subtitleUtils` — formatea segmentos a SRT/VTT
- `subtitleBurner` — quema subtitulos en el video
- `audioSyncUtils` — alinea segmentos al audio real del clip
- `videoTextOverlayCanvas` — renderiza el titulo como imagen y lo superpone al video

## Comportamiento esperado

### Transcripcion
- Dado un clip MP4, `transcriptionService.transcribe` devuelve el texto transcrito y los segmentos con timestamps.
- El idioma se detecta automaticamente. No se traduce.
- El resultado se guarda en un `.txt` con el mismo nombre que el clip.
- Si el clip no tiene audio o la transcripcion falla, se registra un warning y el pipeline continua.

### Subtitulos
- A partir de los segmentos de transcripcion, el pipeline:
  1. Alinea los segmentos al audio real del clip (`alignSubtitleSegmentsToVideo`).
  2. Elimina segmentos sin sonido (`trimSegmentsToSoundOnly`).
  3. Agrupa en bloques de ~5 palabras (`mergeSubtitleSegments`).
  4. Rellena los huecos de silencio para cubrir toda la linea de tiempo (`addSilenceSegments`).
- El resultado se guarda en `.srt` y `.vtt`.
- Los subtitulos se queman en el MP4 (reemplaza el clip).
- Si no hay segmentos de transcripcion, no se generan subtitulos.

### Resumen
- El resumen se genera solo si `summarizationService.isAvailable()` es true y el texto transcrito no esta vacio.
- El resumen es conciso, maximo 100 palabras, en español.
- Se guarda en `_summary.txt`.

### Contenido social
- Se genera un titulo (maximo ~10 palabras, engancha, en español) y una descripcion (maximo 150 palabras, con hashtags, en español).
- El titulo se guarda en `_social_title.txt`.
- La descripcion se guarda en `_social_description.txt`.
- El titulo se superpone en la barra negra superior del video como overlay de texto.
- Antes de añadir el titulo overlay, se crea una copia de seguridad del clip en `_original_no_title.mp4`.

### Overlay de titulo
- El texto se renderiza con Canvas como imagen PNG.
- La imagen se superpone al video con FFmpeg (`overlay` filter).
- Posicion: centrado horizontalmente, en la barra negra superior (~14% desde el top).
- Fuente configurable via variables de entorno `TITLE_FONT_PATH` y `TITLE_FONT_FAMILY`.
- Si no se configura fuente custom, se usa Arial.

## Casos de error

- Si `transcriptionService` lanza error → warning, pipeline continua sin txt/srt/summary/social.
- Si `subtitleBurner` falla → warning, pipeline continua con el clip sin subtitulos quemados.
- Si `summarizationService` falla → warning, pipeline continua sin resumen.
- Si la generacion de contenido social falla → warning, pipeline continua sin titulo overlay.
- Si el titulo overlay falla → warning, el clip queda sin titulo pero el pipeline continua.
- Ningun fallo en este modulo interrumpe el pipeline principal.

## Pendiente / fuera de scope

- Soporte multiidioma explicito (el idioma de salida del LLM es siempre español por ahora).
- Personalizar el numero de palabras por bloque de subtitulo (actualmente hardcodeado a ~5).
- Subtitulos en un idioma distinto al del audio (traduccion automatica).
