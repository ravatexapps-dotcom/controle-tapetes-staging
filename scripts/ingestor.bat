@echo off
setlocal

pushd "%~dp0..\services\documents-ingestor" || exit /b 1

call npm %*
set "EXIT_CODE=%ERRORLEVEL%"

popd
exit /b %EXIT_CODE%
