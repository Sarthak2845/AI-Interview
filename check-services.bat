@echo off
echo ========================================
echo Checking Service Status
echo ========================================
echo.

echo Checking Python Service (port 8000)...
curl -s http://localhost:8000/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Python Service: RUNNING
) else (
    echo ✗ Python Service: NOT RUNNING
)

echo.
echo Checking Java Backend (port 8080)...
curl -s http://localhost:8080/api/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Java Backend: RUNNING
) else (
    echo ✗ Java Backend: NOT RUNNING
)

echo.
echo Checking Frontend (port 5173)...
curl -s http://localhost:5173 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Frontend: RUNNING
) else (
    echo ✗ Frontend: NOT RUNNING
)

echo.
echo ========================================
echo Testing Backend Endpoints
echo ========================================
echo.

echo Testing /api/health...
curl -s http://localhost:8080/api/health
echo.
echo.

echo Testing /api/sessions/all...
curl -s http://localhost:8080/api/sessions/all
echo.
echo.

echo ========================================
echo Service Check Complete
echo ========================================
echo.
echo If any service is not running, use:
echo   start-all-services.bat
echo.
echo For detailed endpoint testing, visit:
echo   http://localhost:5173/?view=test
echo.
pause