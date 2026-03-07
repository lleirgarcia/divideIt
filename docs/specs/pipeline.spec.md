# Pipeline de procesado de video

## Proposito

Dado un video de entrada y una lista de segmentos de tiempo, producir clips independientes listos para publicar en redes sociales (TikTok, Instagram Reels, YouTube Shorts).

## Interfaz publica

```typescript
// videoProcessor.ts
splitVideo(
  inputPath: string,
  outputDir: string,
  segments: Array<{ startTime: number; endTime: number; duration: number }>
): Promise<VideoSegment[]>

// videoService.ts
videoService.splitVideo(
  inputPath: string,
  videoId: string,
  options?: { numSegments?: number; minDuration?: number; maxDuration?: number }
): Promise<{ segments: VideoSegment[]; videoId: string }>
```

## Pasos del pipeline (en orden)

Para cada segmento, el pipeline ejecuta estos pasos en secuencia:

```
1. Extraer clip        → clip{N}.mp4  (formato segun OutputFormat)
2. Transcribir         → clip{N}.txt
3. Generar subtitulos  → clip{N}.srt + clip{N}.vtt
4. Quemar subtitulos   → clip{N}.mp4 (reemplaza)
5. Resumir             → clip{N}_summary.txt
6. Contenido social    → clip{N}_social_title.txt + clip{N}_social_description.txt
7. Titulo overlay      → clip{N}.mp4 (reemplaza)
8. Overlay de juego    → clip{N}.mp4 (reemplaza)
```

Adicionalmente, al inicio del pipeline (antes de procesar segmentos):
```
0. Transcribir video original completo → original_transcription.txt
```

## Comportamiento esperado

### Extraccion de segmento
- El clip extraido tiene exactamente la duracion del segmento (endTime - startTime), con tolerancia de ±0.1s.
- El clip tiene el formato de salida configurado (ver `formato-salida.spec.md`).
- El clip es un MP4 valido con stream de video y audio.

### Resiliencia de pasos opcionales
- Si la transcripcion falla, el pipeline continua y produce el clip sin .txt ni subtitulos.
- Si los subtitulos fallan, el pipeline continua sin subtitulos quemados.
- Si el resumen falla, el pipeline continua sin _summary.txt.
- Si el contenido social falla, el pipeline continua sin _social_title.txt.
- Si el titulo overlay falla, el pipeline continua sin titulo en el video.
- Si el overlay de juego falla, el pipeline continua sin overlay.
- Ningun fallo opcional detiene el pipeline ni lanza una excepcion al caller.

### Salida
- `splitVideo` devuelve un array con un `VideoSegment` por cada segmento de entrada.
- Cada `VideoSegment` incluye `startTime`, `endTime`, `duration` y `outputPath`/`filePath` apuntando al MP4 final.
- Los segmentos se procesan de forma secuencial (no en paralelo) para no saturar el sistema.

### Transcripcion del video original
- Se transcribe el video original completo al inicio, antes de procesar los segmentos.
- El resultado se guarda en `original_transcription.txt` dentro del directorio de salida.
- Si falla, se registra un warning y el pipeline continua.

## Casos de error

- Si `inputPath` no existe o no es un video valido, el pipeline lanza un error antes de procesar ningun segmento.
- Si `outputDir` no se puede crear, el pipeline lanza un error.
- Si un segmento no se puede extraer (FFmpeg falla), ese segmento se omite y el error se registra. Los demas segmentos se procesan igualmente.

## Notas de implementacion

- `videoProcessor.ts` y `videoService.ts` implementan el mismo pipeline. Esta duplicacion es deuda tecnica a resolver.
- El directorio de salida de `videoService` sigue el patron `processed/YYYYMMDD_HHmmss/`.
- Los clips se nombran `clip1.mp4`, `clip2.mp4`, etc.

## Pendiente / fuera de scope

- Procesado en paralelo de segmentos.
- Reanudar un pipeline interrumpido.
- Progreso en tiempo real via websocket.
