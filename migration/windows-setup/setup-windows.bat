@echo off
echo ComplyArk DPDPA Management Platform - Windows Setup Script
echo ========================================================

echo.
echo Step 1: Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing MSSQL packages...
call npm install mssql @types/mssql cross-env
if %errorlevel% neq 0 (
    echo Error: Failed to install MSSQL packages
    pause
    exit /b 1
)

echo.
echo Step 3: Creating environment file...
if not exist .env (
    copy .env.example .env
    echo Environment file created. Please edit .env with your SQL Server details.
) else (
    echo Environment file already exists.
)

echo.
echo Step 4: Creating uploads directory...
if not exist uploads mkdir uploads

echo.
echo Step 5: Creating logs directory...
if not exist logs mkdir logs

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit the .env file with your SQL Server connection details
echo 2. Run the SQL scripts in SQL Server Management Studio:
echo    - 01-create-schema.sql
echo    - 02-insert-sample-data.sql
echo 3. Start the application with: npm run dev
echo.
pause