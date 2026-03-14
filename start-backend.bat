@echo off
echo Building and starting backend...
cd backend

echo Cleaning previous build...
mvn clean

echo Compiling...
mvn compile

if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed! Check errors above.
    pause
    exit /b 1
)

echo Starting Spring Boot application...
mvn spring-boot:run