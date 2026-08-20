@echo off
setlocal enableextensions
cd /d "%~dp0"

set "DB_PATH=%~dp0data\servebox.sqlite"

if exist ".env.local" (
	for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"DB_FILENAME=" ".env.local"`) do (
		if not "%%B"=="" set "DB_PATH=%~dp0data\%%~B"
	)
)

echo Limpando banco local em "%DB_PATH%"...

if exist "%DB_PATH%" (
	del /f /q "%DB_PATH%" >nul 2>&1
	if exist "%DB_PATH%" (
		echo Nao consegui apagar o banco local porque ele esta em uso.
		echo Pare o npm run dev ou qualquer processo conectado ao SQLite e tente de novo.
		pause
		exit /b 1
	)
)

if exist "%DB_PATH%-wal" del /f /q "%DB_PATH%-wal" >nul 2>&1
if exist "%DB_PATH%-shm" del /f /q "%DB_PATH%-shm" >nul 2>&1

echo Banco local limpo. Ao abrir o projeto, o seed sera recriado.
pause