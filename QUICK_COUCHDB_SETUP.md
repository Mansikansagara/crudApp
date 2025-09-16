# Quick CouchDB Setup for Windows

## 🚀 Easy Installation (5 minutes)

### Method 1: Download Installer (Recommended)

1. **Download CouchDB:**
   - Go to: https://couchdb.apache.org/#download
   - Download "Windows" installer
   - Run the installer with default settings

2. **Start CouchDB:**
   ```cmd
   # Option A: Start as Windows Service
   net start "Apache CouchDB"
   
   # Option B: Start manually
   "C:\Program Files\Apache CouchDB\bin\couchdb.cmd"
   ```

3. **Verify Installation:**
   - Open browser: http://admin:admin@192.168.29.13:5984
   - Should see: `{"couchdb":"Welcome","version":"3.x.x"}`

### Method 2: Portable Version

1. **Download portable CouchDB:**
   - Download from: https://github.com/apache/couchdb/releases
   - Extract to `C:\CouchDB`

2. **Start CouchDB:**
   ```cmd
   cd C:\CouchDB\bin
   couchdb.exe
   ```

## ⚙️ Configure for React Native

### 1. Enable CORS (Required)

Open Command Prompt as Administrator:
```cmd
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d "true"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d "*"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"
curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"
```

### 2. Test Connection

```cmd
curl http://admin:admin@192.168.29.13:5984
```

Expected response:
```json
{"couchdb":"Welcome","version":"3.3.3","git_sha":"..."}
```

## 📱 Update App Configuration

The app is already configured for `http://admin:admin@192.168.29.13:5984`. Just restart the React Native app after starting CouchDB.

## ✅ Verification Steps

1. **CouchDB running:** Browser shows welcome message at http://admin:admin@192.168.29.13:5984
2. **CORS enabled:** No CORS errors in app console
3. **App connection:** NetworkStatus shows green "Online" indicator
4. **Sync working:** Tap "Sync" button, check console for success messages

## 🔧 Troubleshooting

**Port already in use:**
```cmd
netstat -ano | findstr :5984
taskkill /PID <process_id> /F
```

**Permission denied:**
- Run Command Prompt as Administrator
- Check Windows Firewall settings

**Still not working:**
- Restart CouchDB service
- Check Windows Services for "Apache CouchDB"
- Try different port: http://localhost:5985

## 🎯 Quick Test

After setup, in your React Native app:
1. Tap "Add Sample Business" 
2. Tap "Sync" button
3. Check http://admin:admin@192.168.29.13:5984/_utils for data
4. Should see "businesses" database with your data

That's it! Your offline-first app now syncs with CouchDB! 🎉
