# Habilitar Google Drive API

## 🔴 Error Detectado

Estás recibiendo este error:
```
Google Drive API has not been used in project 590903768646 before or it is disabled.
```

## ✅ Solución: Habilitar Google Drive API

### Paso 1: Ve a Google Cloud Console

1. Abre: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=590903768646
2. O navega manualmente:
   - Google Cloud Console → **APIs & Services** → **Library**
   - Busca: **"Google Drive API"**

### Paso 2: Habilita la API

1. Haz clic en **"Google Drive API"**
2. Haz clic en el botón **"ENABLE"** o **"HABILITAR"**
3. Espera a que se habilite (puede tomar unos segundos)

### Paso 3: Verifica

Después de habilitar, deberías ver:
- ✅ Estado: **Enabled** o **Habilitada**
- ✅ Puedes ver estadísticas de uso

### Paso 4: Espera y Prueba

1. Espera 1-2 minutos para que los cambios se propaguen
2. Intenta subir los segmentos de nuevo:
   ```bash
   cd backend
   node scripts/upload-existing-segments.js b656be5c-c17d-4ed4-9ba1-c7b43c2f1dd4
   ```

## 🔗 Enlaces Directos

- **Habilitar Google Drive API:** https://console.cloud.google.com/apis/library/drive.googleapis.com?project=590903768646
- **Ver todas las APIs:** https://console.cloud.google.com/apis/dashboard?project=590903768646

## ⚠️ Nota

Si ya habilitaste la API anteriormente, espera unos minutos y vuelve a intentar. A veces Google tarda un poco en propagar los cambios.
