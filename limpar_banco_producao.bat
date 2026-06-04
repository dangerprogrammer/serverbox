@echo off
setlocal enableextensions
cd /d "%~dp0"

set "PROD_DB_URL="

if exist ".env.local" (
  for %%K in (DATABASE_URL SUPABASE_DB_URL SUPABASE_DATABASE_URL) do (
    if not defined PROD_DB_URL (
      for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"%%K=" ".env.local"`) do (
        if not "%%B"=="" set "PROD_DB_URL=%%~B"
      )
    )
  )
)

if not defined PROD_DB_URL (
  echo Nao encontrei DATABASE_URL, SUPABASE_DB_URL ou SUPABASE_DATABASE_URL em .env.local.
  echo Configure uma dessas variaveis antes de limpar o banco de producao.
  pause
  exit /b 1
)

set "SUPABASE_CLI=%~dp0node_modules\.bin\supabase.cmd"

if exist "%SUPABASE_CLI%" (
  set "SUPABASE_CMD=%SUPABASE_CLI%"
) else (
  set "SUPABASE_CMD=supabase"
)

echo Limpando banco de producao...
"%SUPABASE_CMD%" db query "TRUNCATE TABLE administrators, admin_sessions, condominiums, condominium_payments, ball_inventory_movements RESTART IDENTITY CASCADE;" --db-url "%PROD_DB_URL%"

if errorlevel 1 (
  echo Falha ao limpar o banco de producao.
  pause
  exit /b %errorlevel%
)

echo Banco de producao limpo.
echo Banco de producao limpo.

REM Run one-off reseed script (creates admin) if available
set "NODE_CMD=node"
if exist "%~dp0node_modules\.bin\node.exe" (
  set "NODE_CMD=%~dp0node_modules\.bin\node.exe"
)

set "RESEED_SCRIPT=%~dp0scripts\reseed-production.js"
if exist "%RESEED_SCRIPT%" (
  echo Executando reseed para recriar admin (CONFIRM_RESEED=true)...
  set "CONFIRM_RESEED=true"
  set "DATABASE_URL=%PROD_DB_URL%"
  "%NODE_CMD%" "%RESEED_SCRIPT%"
  if errorlevel 1 (
    echo Reseed falhou.
    pause
    exit /b %errorlevel%
  )
  echo Reseed concluido.
)

pause