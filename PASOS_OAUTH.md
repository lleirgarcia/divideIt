# Pasos para obtener el Refresh Token

## ✅ Paso 1: Ya tienes la respuesta correcta

La respuesta que recibiste es correcta. Ahora sigue estos pasos:

---

## Paso 2: Abre la URL de autorización en tu navegador

**Copia y pega esta URL completa en tu navegador** (Chrome, Safari, Firefox, etc.):

```
https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&prompt=consent&response_type=code&client_id=590903768646-tn1pst8e6pcl0sp91dhrn2d0562a12gp.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3051%2Fapi%2Fgoogle-drive%2Foauth%2Fcallback
```

O bien:
1. Extrae solo el valor de `authUrl` (la URL larga que empieza por `https://accounts.google.com/...`)
2. Pégalo en la barra de direcciones del navegador
3. Pulsa Enter

---

## Paso 3: Autoriza la aplicación

1. Inicia sesión con tu cuenta de Google (si no lo has hecho)
2. Verás una pantalla pidiendo permisos para "divideIt" o tu app
3. Haz clic en **"Permitir"** o **"Allow"**

---

## Paso 4: Obtén el código

Después de autorizar, **Google te redirigirá** a una URL como:

```
http://localhost:3051/api/google-drive/oauth/callback?code=4/0AeanS...MUCHO_TEXTO_AQUI...
```

**Importante:** Si tu backend está corriendo, esa página mostrará un JSON con el `refreshToken`.  
Si no está corriendo o la página no carga:

1. **Copia toda la URL** de la barra de direcciones (incluyendo el `?code=...`)
2. El valor después de `code=` es tu **código de autorización**
3. Luego visita en el navegador (reemplaza `TU_CODE` por el código):
   ```
   http://localhost:3051/api/google-drive/oauth/callback?code=TU_CODE
   ```

---

## Paso 5: Copia el Refresh Token

La respuesta será algo como:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "1//0gabcdefghijklmnop...",
    "message": "Authentication successful..."
  }
}
```

**Copia el valor de `refreshToken`** (la cadena larga que empieza por `1//0g...`).

---

## Paso 6: Añade el Refresh Token al .env

1. Abre el archivo `backend/.env`
2. Busca la línea: `GOOGLE_DRIVE_REFRESH_TOKEN=`
3. Pega el token después del `=`:
   ```
   GOOGLE_DRIVE_REFRESH_TOKEN=1//0gabcdefghijklmnop...
   ```
4. Guarda el archivo

---

## Paso 7: Reinicia el backend

```bash
cd backend
# Detén el servidor (Ctrl+C) si está corriendo
npm run dev
```

---

## ✅ Listo

Después de esto, la integración con Google Drive estará completa. Puedes verificar con:

```bash
curl http://localhost:3051/api/google-drive/status
```

Deberías ver: `"authenticated": true`
