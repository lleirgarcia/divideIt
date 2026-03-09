# Spec: Presets de formato

## Contexto

El flujo manual (frontend) permite al usuario elegir `outputFormat`, `animation`, duración, etc. en cada sesión.

Para flujos automatizados (sin intervención humana), se necesitan **presets predefinidos** que encapsulen todos esos parámetros bajo un nombre semántico. El backend aplica los parámetros del preset directamente; el llamante solo envía `preset`.

Los presets **no reemplazan** el modo manual: si no se envía `preset`, el comportamiento actual se mantiene intacto.

---

## Presets definidos

| Preset            | outputFormat | animation       | minDuration | maxDuration | Prefijo carpeta  |
|-------------------|--------------|-----------------|-------------|-------------|------------------|
| `tiktok`           | vertical     | space_invaders  | 30s         | 50s         | `tiktok_`         |
| `instagram`        | horizontal   | none            | 30s         | 50s         | `instagram_`      |
| `instagram_zoom`   | vertical     | none (zoom)     | 30s         | 50s         | `instagram_zoom_` |
| `youtube_shorts`   | vertical     | none (zoom)     | 30s         | 60s         | `youtube_shorts_` |

> El "zoom" en `tiktok_zoom` y `youtube_shorts` es el zoom 280% ya implementado cuando `animation=none` + `vertical`.

---

## Comportamiento

### Resolución de parámetros

Cuando se recibe `preset`:
1. Se cargan los parámetros del preset (format, animation, durations, prefix).
2. Los campos `outputFormat`, `animation`, `minSegmentDuration`, `maxSegmentDuration` del body se **ignoran** (el preset es autoritativo).
3. `segmentCount` sigue siendo configurable aunque se use preset.

### Prefijo de carpeta

El timestamp de la carpeta de salida pasa de `YYYYMMDD_HHmmss` a `{prefix}YYYYMMDD_HHmmss`.

Ejemplo: `tiktok_20260307_143022`

### API

```
POST /api/videos/split
Content-Type: multipart/form-data

video:         <File>
preset:        tiktok | tiktok_zoom | instagram | youtube_shorts   (opcional)
segmentCount:  número (opcional, default 5)

# Solo si NO se envía preset:
outputFormat:        vertical | horizontal
animation:           space_invaders | none
minSegmentDuration:  número
maxSegmentDuration:  número
```

La respuesta incluye el campo `preset` usado (o `null` si modo manual):

```json
{
  "success": true,
  "data": {
    "videoId": "tiktok_20260307_143022",
    "preset": "tiktok",
    "originalVideo": { ... },
    "segments": [ ... ],
    "totalSegments": 3
  }
}
```

---

## Implementación

### Backend — `videoProcessor.ts`

```typescript
export type Preset = 'tiktok' | 'tiktok_zoom' | 'instagram' | 'youtube_shorts';

export interface PresetConfig {
  outputFormat: OutputFormat;
  animation: AnimationOption;
  minSegmentDuration: number;
  maxSegmentDuration: number;
  folderPrefix: string;
}

export const PRESETS: Record<Preset, PresetConfig> = {
  tiktok:         { outputFormat: 'vertical',   animation: 'space_invaders', minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'tiktok_' },
  tiktok_zoom:    { outputFormat: 'vertical',   animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'tiktok_zoom_' },
  instagram:      { outputFormat: 'horizontal', animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'instagram_' },
  youtube_shorts: { outputFormat: 'vertical',   animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 60, folderPrefix: 'youtube_shorts_' },
};
```

### Backend — `videoRoutes.ts`

```typescript
const splitVideoSchema = z.object({
  segmentCount:         z.number().int().min(1).max(20).optional().default(5),
  minSegmentDuration:   z.number().min(1).max(300).optional().default(5),
  maxSegmentDuration:   z.number().min(1).max(300).optional().default(60),
  outputFormat:         z.enum(['vertical', 'horizontal']).optional().default('vertical'),
  animation:            z.enum(['space_invaders', 'none']).optional().default('none'),
  preset:               z.enum(['tiktok', 'tiktok_zoom', 'instagram', 'youtube_shorts']).optional(),
});
```

Resolución en el handler:
```typescript
const presetConfig = preset ? PRESETS[preset] : null;
const resolvedFormat    = presetConfig?.outputFormat    ?? outputFormat;
const resolvedAnimation = presetConfig?.animation       ?? animation;
const resolvedMin       = presetConfig?.minSegmentDuration ?? minSegmentDuration;
const resolvedMax       = presetConfig?.maxSegmentDuration ?? maxSegmentDuration;
const folderPrefix      = presetConfig?.folderPrefix ?? '';
// timestamp: `${folderPrefix}${YYYYMMDD_HHmmss}`
```

---

## Frontend (futuro)

El modo manual actual no cambia. Para el flujo automatizado (sin humano), el llamante envía únicamente:

```
POST /api/videos/split
video=<file>
preset=tiktok
segmentCount=5
```

No se requiere UI nueva para este flujo. Si en el futuro se añade una UI de presets, será una selección rápida que sustituye los controles manuales cuando está activa.

---

## Criterios de aceptación

- [ ] `preset=tiktok` genera clips verticales con Space Invaders, 30-50s, carpeta prefijada `tiktok_`
- [ ] `preset=tiktok_zoom` genera clips verticales con zoom 280%, 30-50s, carpeta `tiktok_zoom_`
- [ ] `preset=instagram` genera clips horizontales, 30-50s, carpeta `instagram_`
- [ ] `preset=youtube_shorts` genera clips verticales con zoom, 30-60s, carpeta `youtube_shorts_`
- [ ] Sin `preset`, el comportamiento manual es idéntico al actual
- [ ] `segmentCount` sigue siendo configurable con preset
- [ ] `videoId` en la respuesta incluye el prefijo de carpeta
