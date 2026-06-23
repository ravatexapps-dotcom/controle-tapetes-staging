@echo off
setlocal

cd /d "%~dp0"

set PORT=8765
set URL=http://localhost:%PORT%/

echo.
echo ==========================================
echo Ravatex Controle de Tapetes - Local Server
echo ==========================================
echo.
echo Pasta: %CD%
echo URL:   %URL%
echo.
echo Abrindo navegador...
start "" "%URL%"

where py >nul 2>nul
if %errorlevel%==0 (
  echo Iniciando servidor com: py -3 -m http.server %PORT%
  echo.
  py -3 -m http.server %PORT%
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Iniciando servidor com: python -m http.server %PORT%
  echo.
  python -m http.server %PORT%
  goto :end
)

echo.
echo ERRO: Python nao encontrado.
echo Instale o Python ou rode manualmente:
echo python -m http.server %PORT%
echo.

:end
echo.
echo Servidor encerrado.
pause
