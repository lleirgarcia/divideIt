# API REST

## Proposito

Exponer el pipeline de procesado de video como una API HTTP consumible desde el frontend y herramientas externas.

## Base URL

`/api`

## Endpoints

---

### POST /api/videos/split

Sube un video y lo divide en clips procesados.

**Request**

- Content-Type: `multipart/form-data`
- Campos:
  | Campo          | Tipo    | Requerido | Default       | Descripcion |
  |----------------|---------|-----------|---------------|-------------|
  | `video`        | File    | Si        | —             | Archivo de video a procesar |
  | `numSegments`  | number  | No        | 3             | Numero de segmentos a generar |
  | `minDuration`  | number  | No        | 5             | Duracion minima de cada segmento (segundos) |
  | `maxDuration`  | number  | No        | 60            | Duracion maxima de cada segmento (segundos) |
  | `outputFormat` | string  | No        | `'vertical'`  | Formato de salida: `'vertical'` o `'horizontal'` |
  | `overlay`      | string  | No        | `'space_invaders'` | Overlay de animacion: `'space_invaders'`, `'pacman'`, `'attention'`, `'none'` |

**Response 200**

```json
{
  "videoId": "20260306_153045",
  "segments": [
    {
      "id": "1",
      "startTime": 10.5,
      "endTime": 35.2,
      "duration": 24.7,
      "filePath": "processed/20260306_153045/clip1.mp4"
    }
  ]
}
```

**Respuestas de error**

| Codigo | Causa |
|--------|-------|
| 400    | No se envio archivo, `outputFormat` invalido, `overlay` invalido, `numSegments` fuera de rango |
| 413    | Archivo demasiado grande (limite configurado en el servidor) |
| 500    | Error interno durante el procesado |

---

### GET /api/videos/download/:filename

Descarga un fichero procesado por nombre.

**Parametros**

- `filename`: nombre del fichero relativo al directorio `processed/` (p.ej. `20260306_153045/clip1.mp4`).

**Response 200**: stream del fichero con Content-Type adecuado.

**Response 404**: el fichero no existe.

---

### GET /api/health

Comprueba que el servidor esta operativo.

**Response 200**

```json
{ "status": "ok", "timestamp": "2026-03-06T15:30:45.000Z" }
```

---

## Comportamiento esperado

- El endpoint `/split` valida los campos antes de iniciar el pipeline. Si la validacion falla, devuelve 400 antes de escribir nada en disco.
- El archivo subido se limpia del directorio `uploads/` tras el procesado, tanto si el pipeline tiene exito como si falla.
- `outputFormat` con valor desconocido devuelve 400 con mensaje: `"outputFormat debe ser 'vertical' o 'horizontal'"`.
- `overlay` con valor desconocido devuelve 400 con mensaje: `"overlay debe ser uno de: space_invaders, pacman, attention, none"`.

## Pendiente / fuera de scope

- Autenticacion / autorizacion.
- Procesado asíncrono con polling de estado (actualmente la llamada es sincrona).
- Webhooks o notificaciones al terminar el procesado.
