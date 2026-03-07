# Formato de salida

## Proposito

Controlar el formato geometrico del clip de salida: vertical (9:16) para redes sociales o horizontal (16:9) para YouTube/contenido tradicional. El formato se configura por llamada al pipeline, no globalmente.

## Tipos

```typescript
type OutputFormat = 'vertical' | 'horizontal';

// vertical  → 1080x1920  (9:16)  — TikTok, Instagram Reels, YouTube Shorts
// horizontal → 1920x1080  (16:9) — YouTube, presentaciones, desktop
```

## Interfaz publica

```typescript
// El formato se pasa como opcion en splitVideo
videoService.splitVideo(inputPath, videoId, {
  numSegments: 3,
  minDuration: 5,
  maxDuration: 60,
  outputFormat: 'vertical' | 'horizontal'   // default: 'vertical'
})

// En el procesador de bajo nivel
splitVideo(inputPath, outputDir, segments, {
  outputFormat: 'vertical' | 'horizontal'   // default: 'vertical'
})

// En el extractor de segmento individual
extractSegment(inputPath, startTime, endTime, outputPath, {
  outputFormat: 'vertical' | 'horizontal'
})
```

## Comportamiento esperado

### Formato vertical (default)
- Resolucion de salida: 1080x1920.
- El video original se escala para encajar dentro del area 1080x1920 manteniendo el aspect ratio original.
- El espacio sobrante se rellena con barras negras (letterbox/pillarbox centrado).
- Nunca se recorta ninguna parte del video original.

### Formato horizontal
- Resolucion de salida: 1920x1080.
- El video original se escala para encajar dentro del area 1920x1080 manteniendo el aspect ratio original.
- El espacio sobrante se rellena con barras negras (letterbox/pillarbox centrado).
- Nunca se recorta ninguna parte del video original.

### Comportamiento comun a ambos formatos
- Si no se especifica `outputFormat`, se usa `'vertical'` por defecto.
- La logica de overlay (titulo, juego) debe adaptarse al formato de salida:
  - En vertical: titulo en barra negra superior, juego en banda inferior.
  - En horizontal: titulo en barra negra superior (si existe), juego en banda inferior.
- El codec de salida es siempre H.264 (libx264), AAC para audio, pix_fmt yuv420p.

### API REST
- El endpoint `POST /api/videos/split` acepta `outputFormat` como campo en el body.
- Si se omite, se usa `'vertical'`.
- Si se envia un valor invalido, el servidor responde 400 con mensaje descriptivo.

## Casos de error

- `outputFormat` con valor no reconocido → error 400 en la API, excepcion en el procesador.
- Si el video de entrada ya tiene el aspect ratio exacto del formato de salida, no se añaden barras negras.

## Pendiente / fuera de scope

- Formatos cuadrados (1:1) o personalizados.
- Recorte (crop) en lugar de letterbox como estrategia alternativa — se especificara en una futura iteracion.
- Multiples formatos de salida en una sola llamada (producir vertical Y horizontal a la vez).
