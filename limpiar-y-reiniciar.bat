@echo off
echo Limpiando proyecto...
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist-electron -ErrorAction SilentlyContinue
echo Limpieza completada.
echo.
echo Iniciando aplicación...
npm run electron:dev



