# Obtener Refresh Token de Google Drive

## ✅ Credenciales Configuradas

Ya tienes configurado en tu `.env`:
- ✅ Client ID: `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
- ✅ Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`
- ✅ Redirect URI: `http://localhost:3051/api/google-drive/oauth/callback`

## ⚠️ Importante: Añadir Redirect URI en Google Console

Antes de continuar, asegúrate de que el Redirect URI esté añadido en Google Cloud Console:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Haz clic en tu OAuth 2.0 Client ID
3. En "Authorized redirect URIs", añade:
   ```
   http://localhost:3051/api/google-drive/oauth/callback
   ```
4. Guarda los cambios

## 🔐 Obtener Refresh Token

### Opción 1: Usando el Script Automático (Recomendado)

1. **Inicia tu servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Ejecuta el script:**
   ```bash
   ./scripts/get-refresh-token.sh
   ```

3. **Sigue las instrucciones** que aparecen en pantalla

### Opción 2: Manual (Paso a Paso)

#### Paso 1: Inicia el servidor backend
```bash
cd backend
npm run dev
```

#### Paso 2: Obtén la URL de autorización
Abre en tu navegador:
```
http://localhost:3051/api/google-drive/auth-url
```

O usa curl:
```bash
curl http://localhost:3051/api/google-drive/auth-url
```

Copia el valor de `authUrl` de la respuesta.

#### Paso 3: Abre la URL de autorización
Abre la URL `authUrl` en tu navegador. Verás algo como:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...
```

#### Paso 4: Autoriza la aplicación
1. Inicia sesión con tu cuenta de Google
2. Haz clic en **"Permitir"** o **"Allow"**
3. Se te redirigirá a una URL como:
   ```
   http://localhost:3051/api/google-drive/oauth/callback?code=4/0AeanS...
   ```

#### Paso 5: Obtén el Refresh Token
Opción A: Abre la URL completa del callback en tu navegador
- La respuesta mostrará el `refreshToken`

Opción B: Usa curl con el código:
```bash
# Reemplaza YOUR_CODE con el código de la URL
curl "http://localhost:3051/api/google-drive/oauth/callback?code=YOUR_CODE"
```

La respuesta será algo como:
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "1//0gabcdefghijklmnopqrstuvwxyz...",
    "message": "Authentication successful..."
  }
}
```

#### Paso 6: Añade el Refresh Token al .env
Copia el `refreshToken` y añádelo a tu `.env`:
```env
GOOGLE_DRIVE_REFRESH_TOKEN=1//0gabcdefghijklmnopqrstuvwxyz...
```

#### Paso 7: Reinicia el servidor backend
```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm run dev
```

## ✅ Verificar que Funciona

1. Visita: `http://localhost:3051/api/google-drive/status`
2. Deberías ver:
   ```json
   {
     "success": true,
     "data": {
       "initialized": true,
       "configured": true,
       "authenticated": true
     }
   }
   ```

## 🎉 ¡Listo!

Ahora puedes usar la integración de Google Drive desde la aplicación web.

## 🔧 Solución de Problemas

**"Redirect URI mismatch"**
- Asegúrate de haber añadido el redirect URI en Google Console
- Verifica que sea exactamente: `http://localhost:3051/api/google-drive/oauth/callback`

**"Invalid client"**
- Verifica que Client ID y Client Secret estén correctos en `.env`
- Asegúrate de no tener espacios extra

**"No refresh token in response"**
- Asegúrate de usar `prompt=consent` (el script lo hace automáticamente)
- Puede que necesites revocar acceso y volver a autorizar
