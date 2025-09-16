# CouchDB Installation Guide for React Native Sync

## Quick Installation Steps

### 1. Download CouchDB
- Go to: https://couchdb.apache.org/#download
- Click "Windows" and download the `.msi` installer
- Direct link: https://archive.apache.org/dist/couchdb/binary/win/3.3.3/apache-couchdb-3.3.3.msi

### 2. Install CouchDB
1. Right-click the downloaded `.msi` file
2. Select "Run as administrator" 
3. Follow installation wizard:
   - Accept license agreement
   - Use default installation path: `C:\Program Files\Apache CouchDB\`
   - **IMPORTANT: Check "Install as Windows Service"** ✅
   - Set admin credentials (optional for local testing)
   - Complete installation

### 3. Start CouchDB Service
Open Command Prompt **as Administrator** and run:
```cmd
net start "Apache CouchDB"
```

Or use Services manager:
1. Press `Win + R`, type `services.msc`
2. Find "Apache CouchDB"
3. Right-click → Start

### 4. Verify Installation
Open browser and go to: http://admin:admin@192.168.29.13:5984

You should see:
```json
{
  "couchdb": "Welcome",
  "version": "3.3.3"
}
```

### 5. Configure CORS for React Native
Run the `configure-cors.bat` script in your project folder, or manually:

```cmd
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d "true"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d "*"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"
```

### 6. Test React Native Sync
1. Start your React Native app
2. Look for NetworkStatus component at top
3. Tap "Sync" button
4. Should show "Connected" status

## Troubleshooting

### Service Won't Start
If you get "System error 5":
1. Ensure you're running Command Prompt as Administrator
2. Try: `sc start "Apache CouchDB"`
3. Or start manually: `"C:\Program Files\Apache CouchDB\bin\couchdb.cmd"`

### Connection Issues
- Check Windows Firewall isn't blocking port 5984
- Verify CouchDB is running: http://admin:admin@192.168.29.13:5984
- Check CORS configuration is applied

### Alternative: Manual Start
If service installation fails, start CouchDB manually:
```cmd
cd "C:\Program Files\Apache CouchDB\bin"
couchdb.cmd
```

## Success Indicators
✅ Browser shows CouchDB welcome message at http://admin:admin@192.168.29.13:5984
✅ React Native app shows "Connected" in NetworkStatus
✅ Sync button works without errors
✅ Data appears in CouchDB admin interface: http://admin:admin@192.168.29.13:5984/_utils
