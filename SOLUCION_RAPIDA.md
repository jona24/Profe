# Solución Rápida para better-sqlite3 en Windows

## Opción 1: Instalar Visual Studio Build Tools Manualmente (Recomendada)

1. **Descarga Visual Studio Build Tools:**
   - Ve a: https://visualstudio.microsoft.com/downloads/
   - Busca "Build Tools for Visual Studio 2022" (gratis)
   - O descarga "Visual Studio Community 2022" (gratis, más completo)

2. **Durante la instalación:**
   - Selecciona "Desktop development with C++"
   - Asegúrate de incluir "Windows 10/11 SDK" y "MSVC v143 - VS 2022 C++ x64/x86 build tools"

3. **Reinicia tu terminal** después de instalar

4. **Limpia e instala:**
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

## Opción 2: Usar npm con configuración específica

Intenta instalar con estas opciones:

```powershell
npm install better-sqlite3 --build-from-source
```

O:

```powershell
npm config set msvs_version 2022
npm install
```

## Opción 3: Instalar solo las dependencias necesarias

```powershell
npm install --save-optional node-gyp
npm install better-sqlite3 --build-from-source
```

## Opción 4: Usar Chocolatey (si lo tienes instalado)

```powershell
choco install visualstudio2022buildtools
```

Luego reinicia y ejecuta `npm install`

## Verificar que funciona

Después de instalar Visual Studio Build Tools, verifica:

```powershell
npm install better-sqlite3 --build-from-source
```

Si funciona, entonces:

```powershell
npm install
```

## Nota Importante

Con Node.js 22, necesitas Visual Studio Build Tools 2022. La versión antigua de windows-build-tools no funciona.



