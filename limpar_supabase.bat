@echo off
REM Caminho para o supabase.exe (ajuste se necessário)
cd /d "%USERPROFILE%\Downloads"

REM Comando para truncar as tabelas (ajuste a connection string se necessário)

set SUPABASE_DB_URL=postgresql://postgres:socket.io.js@db.jxinrwwwndrrrecnhvzt.supabase.co:5432/postgres?sslmode=require

echo TRUNCATE TABLE administrators, admin_sessions, condominiums, condominium_payments, subscriptions, ball_inventory_movements RESTART IDENTITY CASCADE; > limpar.sql

"C:\Users\patrickleo\Downloads\supabase_windows_amd64\supabase.exe" db query "TRUNCATE TABLE administrators, admin_sessions, condominiums, condominium_payments, ball_inventory_movements RESTART IDENTITY CASCADE;" --db-url "%SUPABASE_DB_URL%"

del limpar.sql

pause
