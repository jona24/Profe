# Instrucciones para Resolver el Error de better-sqlite3

## Problema Detectado

Tienes Visual Studio 2019 Build Tools instalado, pero **falta el Windows SDK**. El error indica:
```
gyp ERR! find VS - missing any Windows SDK
```

## Solución: Instalar Windows SDK

### Opción 1: Completar Visual Studio 2019 Build Tools

1. **Abre Visual Studio Installer** (búscalo en el menú de inicio)

2. **Haz clic en "Modificar"** en Visual Studio 2019 Build Tools

3. **Selecciona:**
   - ✅ "Desktop development with C++"
   - ✅ "Windows 10 SDK" (o Windows 11 SDK)
   - ✅ "MSVC v142 - VS 2019 C++ x64/x86 build tools"

4. **Haz clic en "Modificar"** y espera a que termine la instalación

5. **Reinicia tu terminal** (ciérrala y ábrela de nuevo)

6. **Vuelve a instalar:**
```powershell
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"
npm config set msvs_version 2019
npm install
```

### Opción 2: Instalar Windows SDK Independientemente

1. **Descarga Windows SDK:**
   - Ve a: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
   - Descarga "Windows SDK for Windows 11" (o Windows 10)

2. **Instálalo** siguiendo el asistente

3. **Reinicia tu terminal**

4. **Vuelve a instalar:**
```powershell
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"
npm config set msvs_version 2019
npm install
```

### Opción 3: Usar Visual Studio 2022 Community (Recomendada)

Si prefieres usar VS 2022 que ya tienes instalado:

1. **Abre Visual Studio Installer**

2. **Haz clic en "Modificar"** en Visual Studio 2022 Community

3. **Asegúrate de tener seleccionado:**
   - ✅ "Desktop development with C++"
   - ✅ "Windows 10 SDK" o "Windows 11 SDK"
   - ✅ "MSVC v143 - VS 2022 C++ x64/x86 build tools"

4. **Haz clic en "Modificar"**

5. **Reinicia tu terminal**

6. **Configura para VS 2022:**
```powershell
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"
npm config set msvs_version 2022
npm install
```

## Verificar que Funciona

Después de instalar el SDK, prueba:

```powershell
npm install better-sqlite3 --build-from-source
```

Si funciona sin errores, entonces:

```powershell
npm install
```

## Comando Rápido (Después de Instalar SDK)

```powershell
# Navegar al proyecto
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"

# Limpiar instalación anterior
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# Configurar versión de Visual Studio (elige 2019 o 2022 según lo que tengas completo)
npm config set msvs_version 2019

# Instalar
npm install
```

## Nota Importante

El Windows SDK es **esencial** para compilar módulos nativos de Node.js. Sin él, `better-sqlite3` no puede compilarse.



