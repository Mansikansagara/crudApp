@echo off
echo Starting CouchDB with Docker...

REM Remove existing container if it exists
docker rm -f couchdb 2>nul

REM Start CouchDB container
docker run -d ^
  --name couchdb ^
  -p 5984:5984 ^
  -e COUCHDB_USER=admin ^
  -e COUCHDB_PASSWORD=admin ^
  couchdb:3.3

echo Waiting for CouchDB to start...
timeout /t 10

REM Test connection
echo Testing connection...
curl http://admin:admin@192.168.29.13:5984

REM Configure CORS
echo Configuring CORS...
timeout /t 5
curl -X PUT http://admin:admin@localhost:5984/_node/_local/_config/httpd/enable_cors -d "true"
curl -X PUT http://admin:admin@localhost:5984/_node/_local/_config/cors/origins -d "*"
curl -X PUT http://admin:admin@localhost:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"
curl -X PUT http://admin:admin@localhost:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"

echo.
echo CouchDB is running at http://admin:admin@192.168.29.13:5984
echo Admin interface: http://admin:admin@192.168.29.13:5984/_utils
echo Username: admin, Password: password
echo.
echo Now restart your React Native app and test sync!
pause
