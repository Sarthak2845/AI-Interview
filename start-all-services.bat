@echo off
echo ========================================
echo Starting Jankoti AI Interview Platform
echo ========================================
echo.

echo Step 1: Building Backend...
cd backend
mvn clean compile
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend compilation failed!
    echo Please check the errors above and fix them.
    pause
    exit /b 1
)
echo Backend compiled successfully!
echo.

echo Step 2: Starting Python Service...
cd ..\python-service
start "Python Service" cmd /k "python main.py"
echo Python service starting in separate window...
echo.

echo Step 3: Starting Java Backend...
cd ..\backend
start "Java Backend" cmd /k "mvn spring-boot:run"
echo Java backend starting in separate window...
echo.

echo Step 4: Installing Frontend Dependencies (if needed)...
cd ..\frontend
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
)
echo.

echo Step 5: Starting Frontend...
start "React Frontend" cmd /k "npm run dev"
echo Frontend starting in separate window...
echo.

echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Services will be available at:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8080
echo - Python:   http://localhost:8000
echo.
echo Test endpoints at: http://localhost:5173/?view=test
echo View Q&A at:      http://localhost:5173/?view=qa
echo.
echo Press any key to close this window...
pause > nul