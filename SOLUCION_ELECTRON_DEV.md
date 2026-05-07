# Solución para el Error de electron:dev

## Problema

El script `electron:dev` fallaba con `concurrently`. He creado una solución alternativa más robusta.

## Solución Aplicada

### 1. Script Alternativo (`electron-dev.js`)

He creado un script Node.js que:
- ✅ Inicia Vite primero
- ✅ Espera a que el servidor esté listo (verifica http://localhost:5173)
- ✅ Luego inicia Electron
- ✅ Maneja correctamente Ctrl+C para cerrar ambos procesos

### 2. Scripts Disponibles

Ahora tienes **3 opciones** para ejecutar en desarrollo:

#### Opción 1: Script Mejorado (Recomendado)
```powershell
npm run electron:dev
```
Usa el nuevo script `electron-dev.js` que es más robusto.

#### Opción 2: Método Simple (2 terminales)
```powershell
# Terminal 1:
npm run dev

# Terminal 2 (después de que Vite inicie):
npm run electron:dev:simple
```

#### Opción 3: Concurrently Mejorado
```powershell
npm run electron:dev:alt
```

## Cómo Usar

**Recomendado:** Usa la Opción 1:

```powershell
npm run electron:dev
```

El script:
1. Iniciará Vite automáticamente
2. Esperará a que esté listo (hasta 30 segundos)
3. Iniciará Electron automáticamente
4. Mostrará mensajes informativos en cada paso

## Si Aún Hay Problemas

1. **Verifica que el puerto 5173 esté libre:**
```powershell
netstat -ano | findstr :5173
```

2. **Limpia y reinicia:**
```powershell
.\limpiar-y-reiniciar.bat
```

3. **Ejecuta manualmente en 2 terminales:**
   - Terminal 1: `npm run dev`
   - Terminal 2: `npx electron .`

## Notas

- El script `electron-dev.js` verifica que Vite esté listo antes de iniciar Electron
- Maneja correctamente la limpieza cuando cierras con Ctrl+C
- Muestra mensajes claros en cada paso



