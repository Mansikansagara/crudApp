@echo off
echo Installing CouchDB for React Native Sync...

REM Check if Chocolatey is installed
choco --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Chocolatey first...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
)

REM Install CouchDB via Chocolatey
echo Installing CouchDB...
choco install couchdb -y

REM Start CouchDB service
echo Starting CouchDB service...
net start "Apache CouchDB"

REM Wait for CouchDB to start
timeout /t 10

REM Test connection
echo Testing CouchDB connection...
curl http://admin:admin@192.168.29.13:5984

REM Configure CORS
echo Configuring CORS for React Native...
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d "true"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d "*"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"

echo.
echo CouchDB setup complete!
echo Open http://admin:admin@192.168.29.13:5984 in your browser to verify
echo Now restart your React Native app and test sync
pause
