# CouchDB Setup Guide for Offline-First React Native App

## 🎯 Overview
This guide explains how to set up CouchDB synchronization for your offline-first React Native app.

## 📋 Prerequisites
- CouchDB server (local or remote)
- Network connectivity between your device and CouchDB server
- CouchDB server configured to allow CORS

## 🚀 Quick Setup

### Option 1: Local CouchDB Server (Development)

1. **Install CouchDB locally:**
   ```bash
   # Windows (using Chocolatey)
   choco install couchdb
   
   # macOS (using Homebrew)
   brew install couchdb
   
   # Ubuntu/Debian
   sudo apt-get install couchdb
   ```

2. **Start CouchDB:**
   ```bash
   # Start CouchDB service
   sudo systemctl start couchdb
   
   # Or run directly
   couchdb
   ```

3. **Configure CouchDB:**
   - Open http://admin:admin@192.168.29.13:5984/_utils
   - Complete the setup wizard
   - Create admin user (optional but recommended)

4. **Enable CORS (Required for React Native):**
   ```bash
   curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
   curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d '"*"'
   curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/credentials -d '"true"'
   curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
   curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
   ```

### Option 2: Remote CouchDB Server (Production)

1. **Use a cloud CouchDB service:**
   - IBM Cloudant
   - Apache CouchDB on DigitalOcean/AWS
   - Couchbase Cloud

2. **Get your connection URL:**
   ```
   https://username:password@your-server.com:5984
   ```

## 📱 App Configuration

### 1. Update CouchDB URL in the app

Edit `src/database/couchdbSync.js`:
```javascript
// Change this line to your CouchDB server IP/URL
this.couchdbUrl = 'http://192.168.29.13:5984'; // Your server IP
```

**Important IP Configuration:**
- **Local development:** Use your computer's local IP (not localhost)
- **Find your IP:**
  ```bash
  # Windows
  ipconfig
  
  # macOS/Linux
  ifconfig
  ```
- **Example:** If your computer IP is `192.168.29.13`, use `http://192.168.29.13:5984`

### 2. Test Connection

1. **Open the app**
2. **Tap the "Sync" button** in the NetworkStatus component
3. **Check console logs** for connection status:
   - ✅ "CouchDB server is reachable" = Success
   - ❌ "CouchDB server not reachable" = Check IP/URL

## 🔄 How Sync Works

### Offline Mode
- All data saves locally using RxDB
- CRUD operations work without internet
- Data persists until sync occurs

### Online Mode
- Automatic connection check to CouchDB
- Bidirectional sync (push local → CouchDB, pull CouchDB → local)
- Periodic sync every 60 seconds
- Manual sync via "Sync" button

### Sync Process
1. **Push Phase:** Local changes → CouchDB
2. **Pull Phase:** CouchDB changes → Local
3. **Conflict Resolution:** Last write wins (simple strategy)

## 🛠 Troubleshooting

### Common Issues

**1. "CouchDB server not reachable"**
- Check if CouchDB is running: `curl http://your-ip:5984`
- Verify IP address is correct
- Check firewall settings
- Ensure CORS is enabled

**2. "Failed to create database"**
- Check CouchDB permissions
- Verify admin credentials if auth is enabled
- Check database naming (lowercase, no spaces)

**3. Sync conflicts**
- App uses "last write wins" strategy
- Check console for conflict logs
- Manual resolution may be needed for complex conflicts

### Debug Commands

**Test CouchDB connection:**
```bash
# Check if CouchDB is running
curl http://your-ip:5984

# Check specific database
curl http://your-ip:5984/businesses

# Create database manually
curl -X PUT http://your-ip:5984/businesses
```

## 📊 Monitoring Sync

### In the App
- **Green indicator:** Online and syncing
- **Red indicator:** Offline mode
- **Sync button:** Manual sync trigger
- **Console logs:** Detailed sync information

### CouchDB Admin Interface
- Open http://your-ip:5984/_utils
- View databases: `businesses`, `articles`
- Monitor document counts and changes

## 🔧 Advanced Configuration

### Custom Sync Intervals
Edit `src/database/replicationService.js`:
```javascript
// Change sync frequency (default: 60000ms = 1 minute)
}, 30000); // Sync every 30 seconds
```

### Authentication
Add authentication to CouchDB URL:
```javascript
this.couchdbUrl = 'http://username:password@your-server.com:5984';
```

### Multiple Environments
```javascript
// Development
const DEV_COUCHDB = 'http://192.168.29.13:5984';

// Production  
const PROD_COUCHDB = 'https://your-production-server.com:5984';

// Use based on environment
this.couchdbUrl = __DEV__ ? DEV_COUCHDB : PROD_COUCHDB;
```

## ✅ Testing Checklist

- [ ] CouchDB server running and accessible
- [ ] CORS enabled on CouchDB
- [ ] App shows correct IP in NetworkStatus
- [ ] Manual sync works (green status)
- [ ] Data appears in CouchDB admin interface
- [ ] Offline mode works (red status)
- [ ] Data syncs when coming back online

## 🎉 Success Indicators

When everything is working correctly:
1. **NetworkStatus shows:** "🟢 Online - Data automatically synced with CouchDB"
2. **Console logs show:** "✅ Full sync completed!"
3. **CouchDB admin shows:** Documents in `businesses` and `articles` databases
4. **Offline/Online transitions work smoothly**

## 📞 Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify CouchDB server status and CORS configuration
3. Test connection manually using curl commands
4. Ensure correct IP address and port configuration
