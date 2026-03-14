@echo off
echo Installing frontend dependencies...
cd frontend
npm install
echo.
echo Frontend dependencies installed successfully!
echo.
echo To start the application:
echo 1. Run: start-jankoti.bat
echo 2. Or manually start each service:
echo    - Python: cd python-service && python main.py
echo    - Java: cd backend && mvn spring-boot:run  
echo    - React: cd frontend && npm run dev
pause