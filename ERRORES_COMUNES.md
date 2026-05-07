# Errores Comunes y Soluciones

## Error: "electronAPI is not defined" o "Cannot read property of undefined"

**Causa:** El código intenta acceder a `window.electronAPI` antes de que esté disponible.

**Solución:** 
- Asegúrate de que el preload script se carga correctamente
- Verifica que `electron/main.ts` tenga la ruta correcta al preload
- Reinicia la aplicación

## Error: "Module not found" o "Cannot resolve module"

**Causa:** Problemas con las importaciones de módulos ES o rutas incorrectas.

**Soluciones:**
1. Verifica que todas las importaciones usen la extensión `.js` en los archivos TypeScript del proceso de Electron
2. Asegúrate de que los alias en `vite.config.ts` estén correctos
3. Ejecuta `npm install` nuevamente

## Error: "better-sqlite3" no se puede cargar

**Causa:** El módulo nativo no se compiló correctamente o falta.

**Solución:**
- Ya está resuelto con la versión 12.5.0 que tiene binarios precompilados
- Si persiste, ejecuta: `npm install better-sqlite3@latest --force`

## Error: "Database is not initialized"

**Causa:** La base de datos no se inicializó antes de usarse.

**Solución:** 
- Verifica que `initDatabase()` se llame en `electron/main.ts` antes de registrar los IPC handlers
- Revisa los permisos de escritura en `%APPDATA%/gestor-academico/`

## Error: "IPC handler not found"

**Causa:** Un handler IPC no está registrado o tiene un nombre incorrecto.

**Solución:**
- Verifica que todos los handlers estén registrados en `registerIpcHandlers()`
- Asegúrate de que los nombres coincidan entre `preload.ts` y `main.ts`

## Error: "Failed to load resource" en la consola del navegador

**Causa:** Vite no está sirviendo los archivos correctamente o hay un problema con el build.

**Solución:**
1. Detén el servidor (Ctrl+C)
2. Elimina `node_modules/.vite` y `dist-electron`
3. Ejecuta `npm run electron:dev` nuevamente

## Error: TypeScript compilation errors

**Causa:** Errores de tipos o sintaxis en TypeScript.

**Solución:**
- Ejecuta `npm run lint` para ver los errores
- Revisa los archivos mencionados en los errores
- Asegúrate de que todos los tipos estén correctamente definidos

## Error: "Port 5173 already in use"

**Causa:** Otra aplicación está usando el puerto de Vite.

**Solución:**
- Cambia el puerto en `vite.config.ts` (línea 47)
- O cierra la otra aplicación que usa el puerto

## Verificación Rápida

Si ves muchos errores, ejecuta estos comandos en orden:

```powershell
# 1. Detener cualquier proceso en ejecución
# (Ctrl+C en la terminal)

# 2. Limpiar caché y builds
Remove-Item -Recurse -Force node_modules/.vite, dist-electron -ErrorAction SilentlyContinue

# 3. Reinstalar dependencias
npm install

# 4. Iniciar de nuevo
npm run electron:dev
```

## Si los errores persisten

1. **Revisa la consola del navegador** (F12 en la ventana de Electron)
2. **Revisa la consola de Node.js** (donde ejecutaste `npm run electron:dev`)
3. **Comparte los mensajes de error específicos** para poder ayudarte mejor



