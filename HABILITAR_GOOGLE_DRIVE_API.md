# Cómo habilitar Google Drive API

## ¿Por qué no veo "divideIt" en Drive?

Si buscas "divideIt" y no aparece nada, es porque **los archivos no se han subido**. Para que se suban, la **Google Drive API** debe estar **habilitada** en tu proyecto de Google Cloud.

---

## Pasos para habilitar la API

### 1. Abre Google Cloud Console

Abre este enlace en tu navegador:

**https://console.cloud.google.com/apis/library/drive.googleapis.com**

Si te pide elegir proyecto, selecciona **"vuildinginpublic"** (o el que usaste para las credenciales).

---

### 2. Busca "Google Drive API"

- Si ya estás en la página de la API, verás **"Google Drive API"** y un botón.
- Si no, en el buscador de la biblioteca escribe: **Google Drive API**.

---

### 3. Haz clic en "HABILITAR" / "ENABLE"

- Entra en la ficha de **Google Drive API**.
- Haz clic en el botón **"HABILITAR"** (o **"ENABLE"** si está en inglés).

---

### 4. Confirma que está habilitada

Después de habilitar deberías ver:

- Un mensaje tipo "API habilitada" / "API enabled".
- El botón pasa a **"GESTIONAR"** / **"MANAGE"** (ya no dice "HABILITAR").

---

### 5. Espera 1–2 minutos

Google puede tardar un poco en aplicar el cambio. Espera 1–2 minutos antes de subir.

---

### 6. Vuelve a subir los segmentos

En la terminal:

```bash
cd backend
node scripts/upload-existing-segments.js b656be5c-c17d-4ed4-9ba1-c7b43c2f1dd4
```

Si todo va bien, verás mensajes de subida. Luego en Drive:

- Busca otra vez **"divideIt"**, o
- Mira en **"Mi unidad"** → debería aparecer la carpeta **divideIt**.

---

## Enlaces directos

| Acción   | Enlace |
|----------|--------|
| Ir a la API | https://console.cloud.google.com/apis/library/drive.googleapis.com |
| Con tu proyecto | https://console.cloud.google.com/apis/library/drive.googleapis.com?project=590903768646 |

---

## Resumen

1. Abre el enlace de la API.
2. Clic en **HABILITAR**.
3. Espera 1–2 minutos.
4. Ejecuta el script de subida.
5. Busca **"divideIt"** en Google Drive.

Cuando la API esté habilitada y el script termine sin errores, la carpeta **divideIt** y los archivos deberían verse en tu Drive.
