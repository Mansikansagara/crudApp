@echo off
echo Configuring CouchDB CORS for React Native...

REM Test if CouchDB is running
curl -s http://admin:admin@192.168.29.13:5984 >nul
if %errorlevel% neq 0 (
    echo ERROR: CouchDB is not running at http://admin:admin@192.168.29.13:5984
    echo Please start CouchDB service first: net start "Apache CouchDB"
    pause
    exit /b 1
)

echo CouchDB is running. Configuring CORS...

REM Configure CORS settings
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d "true"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d "*"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"

echo.
echo CORS configuration complete!
echo.
echo CouchDB is ready for React Native sync at: http://admin:admin@192.168.29.13:5984
echo Admin interface: http://admin:admin@192.168.29.13:5984/_utils
echo.
echo Now restart your React Native app and test sync!
pause
