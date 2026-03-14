@echo off
echo Testing Backend Endpoints...
echo.

echo 1. Testing Health Endpoint:
curl -X GET http://localhost:8080/api/health
echo.
echo.

echo 2. Testing Routes Endpoint:
curl -X GET http://localhost:8080/api/test-routes
echo.
echo.

echo 3. Testing All Sessions Endpoint:
curl -X GET http://localhost:8080/api/sessions/all
echo.
echo.

echo 4. Testing Session Q&A Endpoint (with session ID 1):
curl -X GET http://localhost:8080/api/session/1/qa
echo.
echo.

echo Test completed!
pause