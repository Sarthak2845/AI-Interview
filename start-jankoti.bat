@echo off
echo Starting Jankoti AI Interview Platform...
echo.

echo Starting Python Service...
start "Python Service" cmd /k "cd python-service && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Java Backend...
start "Java Backend" cmd /k "cd backend && mvn spring-boot:run"

timeout /t 5 /nobreak >nul

echo Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting...
echo.
echo Services will be available at:
echo - Frontend: http://localhost:5173
echo - Java Backend: http://localhost:8080
echo - Python Service: http://localhost:8000
echo.
echo Press any key to exit...
pause >nul