# Solución: Error redirect_uri_mismatch

## 🔴 Problema

Estás recibiendo el error:
```
Error 400: redirect_uri_mismatch
```

Esto significa que el Redirect URI no está configurado en Google Cloud Console.

## ✅ Solución: Añadir Redirect URI en Google Console

### Paso 1: Ve a Google Cloud Console

1. Abre: https://console.cloud.google.com/apis/credentials
2. Asegúrate de que estás en el proyecto correcto: **"vuildinginpublic"**

### Paso 2: Edita tu OAuth 2.0 Client ID

1. En la lista de "OAuth 2.0 Client IDs", encuentra tu cliente:
   - **Name:** divideIt Drive Integration (o el nombre que le diste)
   - **Client ID:** `590903768646-tn1pst8e6pcl0sp91dhrn2d0562a12gp.apps.googleusercontent.com`

2. **Haz clic en el nombre** del cliente para editarlo

### Paso 3: Añade el Redirect URI

1. Desplázate hasta la sección **"Authorized redirect URIs"**
2. Haz clic en **"+ ADD URI"**
3. Añade exactamente esta URL (copia y pega):
   ```
   http://localhost:3051/api/google-drive/oauth/callback
   ```
   
   ⚠️ **IMPORTANTE:** 
   - Debe ser exactamente igual (sin espacios, sin trailing slash)
   - Usa `http://` no `https://`
   - El puerto es `3051`

4. Haz clic en **"SAVE"** (Guardar)

### Paso 4: Verifica

Después de guardar, deberías ver el Redirect URI en la lista:
```
http://localhost:3051/api/google-drive/oauth/callback
```

## 🔄 Probar de Nuevo

1. Espera unos segundos para que los cambios se propaguen (puede tomar 1-2 minutos)
2. Intenta de nuevo:
   - Visita: `http://localhost:3051/api/google-drive/auth-url`
   - Copia el `authUrl` y ábrelo en tu navegador
   - Ahora debería funcionar sin el error

## 📸 Guía Visual

Si necesitas ayuda visual:

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Busca tu **OAuth 2.0 Client ID**
3. Haz clic para **editar**
4. En **"Authorized redirect URIs"** → **"+ ADD URI"**
5. Pega: `http://localhost:3051/api/google-drive/oauth/callback`
6. **SAVE**

## ✅ Checklist: Qué revisar si sigue fallando

- [ ] **Proyecto correcto:** En la consola, arriba, el proyecto es **"vuildinginpublic"** (o el que usaste).
- [ ] **Tipo de cliente:** El cliente es **"Web application"** (no "Desktop" ni "Android").
- [ ] **Sección correcta:** Añadiste la URI en **"Authorized redirect URIs"** (no en "Authorized JavaScript origins").
- [ ] **Texto exacto:** Copiaste y pegaste esto sin cambiar nada:
  ```
  http://localhost:3051/api/google-drive/oauth/callback
  ```
- [ ] **Sin espacios:** No hay espacio antes ni después de la URI.
- [ ] **Sin barra final:** No termina en `/` (no uses `.../callback/`).
- [ ] **Guardaste:** Pulsaste **SAVE** y ves el mensaje de confirmación.
- [ ] **Esperaste:** 1–2 minutos después de guardar antes de probar de nuevo.
- [ ] **Misma cuenta:** La cuenta con la que inicias sesión en la app es la del proyecto de Google Cloud (o está como usuario de prueba si la app está en modo "Testing").

## ⚠️ Errores Comunes

**"El URI ya existe"**
→ Bien, ya está. Comprueba que sea exactamente `http://localhost:3051/api/google-drive/oauth/callback` y prueba de nuevo.

**"Formato inválido"**
→ Copia exactamente: `http://localhost:3051/api/google-drive/oauth/callback`
→ Sin espacios al inicio o final
→ Usa `http://` (no `https://`)

**"Sigue redirect_uri_mismatch"**
→ Espera 2–5 minutos tras guardar y vuelve a abrir la URL de login (mejor en ventana de incógnito).
→ Comprueba que estés editando el cliente con Client ID `590903768646-tn1pst8e6pcl0sp91dhrn2d0562a12gp...`.
→ Si la app está en "Testing", añade tu cuenta (lleirgarcia@gmail.com) en "OAuth consent screen" → "Test users".

## ✅ Verificación Final

Una vez configurado correctamente, cuando abras la URL de autorización deberías ver:
- ✅ Página de inicio de sesión de Google (sin errores)
- ✅ Opción para autorizar la aplicación
- ✅ Después de autorizar, redirección a: `http://localhost:3051/api/google-drive/oauth/callback?code=...`
