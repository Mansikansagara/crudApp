# Business Manager - Offline-First CRUD Application

A React Native application that demonstrates offline-first architecture using RxDB, CouchDB replication, and local storage. This app allows users to manage businesses and their articles with full offline functionality and automatic synchronization when online.

## 🎯 Features

- ✅ **Offline-First Architecture**: Works completely without internet connection
- ✅ **CRUD Operations**: Create, Read, Update, Delete businesses and articles
- ✅ **Auto-Sync**: Automatically syncs with CouchDB when internet is available
- ✅ **Real-time Network Status**: Visual indicator of online/offline status
- ✅ **Data Persistence**: Local storage using RxDB with memory adapter
- ✅ **Modern UI**: Clean and intuitive user interface
- ✅ **Cross-Platform**: Works on both Android and iOS

## 🏗️ Architecture

### Data Models

**Business Model:**
```json
{
  "id": "string",           // Unique ID (auto-generated)
  "name": "string",         // Business name
  "createdAt": "datetime",  // Creation timestamp
  "updatedAt": "datetime"   // Last update timestamp
}
```

**Article Model:**
```json
{
  "id": "string",           // Unique ID (auto-generated)
  "name": "string",         // Article name
  "qty": "number",          // Quantity in stock
  "selling_price": "number", // Selling price
  "business_id": "string",  // Reference to Business (foreign key)
  "createdAt": "datetime",  // Creation timestamp
  "updatedAt": "datetime"   // Last update timestamp
}
```

### Technology Stack

- **Frontend**: React Native (CLI)
- **Database**: RxDB with PouchDB
- **Local Storage**: Memory adapter (can be upgraded to SQLite)
- **Replication**: CouchDB sync protocol
- **Navigation**: React Navigation v6
- **Network Detection**: @react-native-community/netinfo
- **State Management**: React Hooks

## 🚀 Getting Started

### Prerequisites

- Node.js (>=20)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- CouchDB server (optional, for sync functionality)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MyApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install iOS dependencies (iOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the Application

1. **Start Metro bundler:**
   ```bash
   npm start
   ```

2. **Run on Android:**
   ```bash
   npm run android
   ```

3. **Run on iOS:**
   ```bash
   npm run ios
   ```

## 🔧 CouchDB Configuration

### Setting up CouchDB Server

1. **Install CouchDB:**
   - Download from [Apache CouchDB](https://couchdb.apache.org/)
   - Or use Docker: `docker run -p 5984:5984 -d couchdb:latest`

2. **Configure CouchDB:**
   - Access CouchDB admin panel at `http://admin:admin@192.168.29.13:5984/_utils`
   - Create admin user
   - Enable CORS for your React Native app

3. **Update Configuration:**
   Edit `src/database/replication.js`:
   ```javascript
   const COUCHDB_URL = 'http://your-couchdb-server:5984';
   const COUCHDB_USERNAME = 'your-username';
   const COUCHDB_PASSWORD = 'your-password';
   ```

### Database Setup

The app automatically creates the following databases:
- `businesses` - Stores business records
- `articles` - Stores article records

## 📱 How to Use

### Managing Businesses

1. **View Businesses**: Launch app → "Manage Businesses"
2. **Add Business**: Tap the "+" button → Enter business name → Save
3. **Edit Business**: Tap "Edit" on any business card
4. **Delete Business**: Tap "Delete" (also removes associated articles)
5. **View Articles**: Tap "View Articles" to see business-specific articles

### Managing Articles

1. **View All Articles**: Home screen → "View All Articles"
2. **Add Article**: Tap "+" → Fill form (name, quantity, price, business) → Save
3. **Edit Article**: Tap "Edit" on any article card
4. **Delete Article**: Tap "Delete" on any article card

### Offline Functionality

- **Network Status**: Green indicator = Online, Red = Offline
- **Offline Operations**: All CRUD operations work without internet
- **Auto-Sync**: Data automatically syncs when connection is restored
- **Sync Status**: "Syncing" indicator shows when replication is active

## 🏗️ Project Structure

```
src/
├── database/
│   ├── database.js          # RxDB configuration and schemas
│   └── replication.js       # CouchDB replication manager
├── navigation/
│   └── AppNavigator.js      # React Navigation setup
├── screens/
│   ├── HomeScreen.js        # Main dashboard
│   ├── BusinessListScreen.js    # Business list and management
│   ├── BusinessFormScreen.js    # Business create/edit form
│   ├── ArticleListScreen.js     # Article list and management
│   └── ArticleFormScreen.js     # Article create/edit form
└── services/
    ├── BusinessService.js   # Business CRUD operations
    └── ArticleService.js    # Article CRUD operations
```

## 🔄 Offline-First Implementation

### Data Flow

1. **Create/Update**: Data saved locally first, then synced to server
2. **Read**: Always read from local database for instant response
3. **Delete**: Removed locally first, then synced to server
4. **Sync**: Bidirectional sync when network is available

### Network Detection

- Uses `@react-native-community/netinfo` for network monitoring
- Automatically starts/stops replication based on connectivity
- Visual feedback for network status

### Conflict Resolution

- Uses CouchDB's built-in conflict resolution
- Last-write-wins strategy for simplicity
- Can be extended for custom conflict resolution

## 📦 Building for Production

### Building APK

### Debug APK (Successfully Built)
To build a debug APK:

```bash
cd android
./gradlew assembleDebug
```

The debug APK is available at `android/app/build/outputs/apk/debug/app-debug.apk` (98MB).

### Release APK
To build a production APK:

```bash
cd android
./gradlew assembleRelease
```

**Note**: The release build currently has compatibility issues with some native dependencies. The debug APK is fully functional and can be used for testing and demonstration purposes.

### iOS IPA

1. **Build for release:**
   ```bash
   npx react-native run-ios --configuration Release
   ```

2. **Archive in Xcode:**
   - Open `ios/MyApp.xcworkspace` in Xcode
   - Product → Archive
   - Export IPA

## 🧪 Testing

### Manual Testing Scenarios

1. **Offline CRUD**: Turn off internet, perform all operations
2. **Sync Test**: Create data offline, go online, verify sync
3. **Conflict Test**: Modify same record on different devices
4. **Network Toggle**: Test app behavior during network changes

### Automated Testing

```bash
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues:**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Database initialization errors:**
   - Check console logs for specific error messages
   - Ensure all dependencies are properly installed

### Performance Optimization

- Database uses memory adapter for fast access
- Lazy loading for large datasets
- Efficient re-rendering with React hooks

## 📚 Learning Resources

- [RxDB Documentation](https://rxdb.info/)
- [CouchDB Documentation](https://docs.couchdb.org/)
- [React Navigation](https://reactnavigation.org/)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Demo

The app demonstrates:
- Complete offline functionality
- Real-time sync when online
- Modern React Native UI patterns
- Production-ready architecture
- Cross-platform compatibility

Perfect for learning offline-first mobile app development!
