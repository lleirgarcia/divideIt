# Añadir Usuario de Prueba (Test User)

## 🔴 Problema

Estás recibiendo este mensaje:
```
vuildinginpublic no ha completado el proceso de verificación de Google. 
En estos momentos, la app se está probando y solo pueden acceder a ella 
los testers aprobados por el desarrollador.
```

Esto significa que tu aplicación OAuth está en modo **"Testing"** y necesitas añadir tu cuenta como tester.

---

## ✅ Solución: Añadir Test User

### Paso 1: Ve a OAuth Consent Screen

1. Abre: https://console.cloud.google.com/apis/credentials/consent
2. O navega manualmente:
   - Google Cloud Console → **APIs & Services** → **OAuth consent screen**
3. Asegúrate de estar en el proyecto: **"vuildinginpublic"**

### Paso 2: Añade tu Email como Test User

1. Desplázate hasta la sección **"Test users"**
2. Haz clic en **"+ ADD USERS"**
3. En el campo de texto, escribe tu email:
   ```
   lleirgarcia@gmail.com
   ```
4. Haz clic en **"ADD"** o **"AÑADIR"**

### Paso 3: Verifica

Después de añadir, deberías ver tu email en la lista de "Test users":
```
✅ lleirgarcia@gmail.com
```

### Paso 4: Prueba de Nuevo

1. Espera unos segundos (puede tomar hasta 1 minuto)
2. Intenta de nuevo la autorización:
   - Visita: `http://localhost:3051/api/google-drive/auth-url`
   - Copia el `authUrl` y ábrelo en tu navegador
   - Ahora deberías poder autorizar sin problemas

---

## 📸 Guía Visual

**Ruta exacta:**
1. Google Cloud Console
2. **APIs & Services** (menú lateral izquierdo)
3. **OAuth consent screen**
4. Scroll hasta **"Test users"**
5. **"+ ADD USERS"**
6. Escribe: `lleirgarcia@gmail.com`
7. **ADD**

---

## ⚠️ Notas Importantes

**¿Cuántos usuarios puedo añadir?**
- En modo Testing puedes añadir hasta **100 usuarios de prueba**

**¿Cuándo necesito verificar la app?**
- Solo si quieres que cualquier usuario de Google pueda usar tu app
- Para desarrollo personal, el modo Testing es suficiente

**¿Qué pasa si no veo "Test users"?**
- Asegúrate de que el "User Type" sea **"External"**
- Si es "Internal", solo funciona con usuarios de tu organización

---

## ✅ Verificación Final

Una vez añadido como test user, cuando abras la URL de autorización deberías ver:
- ✅ Página de inicio de sesión de Google (sin el mensaje de error)
- ✅ Opción para autorizar la aplicación
- ✅ Después de autorizar, redirección exitosa con el código

---

## 🔄 Alternativa: Publicar la App (No Recomendado para Desarrollo)

Si prefieres que cualquier usuario pueda acceder (no recomendado para desarrollo):

1. Ve a **OAuth consent screen**
2. Haz clic en **"PUBLISH APP"**
3. Completa el proceso de verificación de Google (puede tomar días/semanas)
4. **Nota:** Esto es innecesario para desarrollo personal

**Recomendación:** Usa el modo Testing con test users. Es más rápido y seguro para desarrollo.
