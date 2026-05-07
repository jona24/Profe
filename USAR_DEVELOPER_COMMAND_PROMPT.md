# Usar Developer Command Prompt para VS 2022

El problema es que node-gyp no puede detectar Visual Studio 2022 desde PowerShell normal. Necesitamos usar el Developer Command Prompt que tiene todas las variables configuradas.

## Solución Rápida:

1. **Abre el menú de inicio de Windows**
2. **Busca:** "Developer Command Prompt for VS 2022"
   - O busca: "x64 Native Tools Command Prompt for VS 2022"
3. **Ábrelo** (se abrirá una ventana de comandos negra)
4. **Navega al proyecto:**
```cmd
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"
```
5. **Ejecuta:**
```cmd
npm install
```

El Developer Command Prompt tiene todas las variables de entorno (VCINSTALLDIR, etc.) configuradas correctamente, por lo que node-gyp podrá encontrar Visual Studio 2022.

## Alternativa: Configurar Variables Manualmente

Si prefieres usar PowerShell, puedes ejecutar este script primero:

```powershell
& "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
cd "C:\Users\JAAlvarezG\OneDrive - Ministerio de Educación\Profe"
npm install
```

Pero el Developer Command Prompt es más fácil y confiable.



