import { getDatabase } from './database';
import { couchdbSync } from './couchdbSync';

class ReplicationService {
  constructor() {
    this.isOnline = false;
    this.replicationStates = {};
    this.syncInterval = null;
    this.lastSyncTime = null;
  }

  // Set CouchDB server URL
  setCouchDBUrl(url) {
    couchdbSync.setCouchDBUrl(url);
  }

  // Check if device is online using CouchDB connection
  async checkNetworkStatus() {
    try {
      const isConnected = await couchdbSync.checkCouchDBConnection();
      this.isOnline = isConnected;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  // Start replication for a collection (simplified)
  async startReplication(collectionName) {
    try {
      console.log(`Simulating replication start for ${collectionName}`);
      // For now, just simulate replication without actual CouchDB sync
      // This can be expanded later when CouchDB server is available
      this.replicationStates[collectionName] = { active: true };
      console.log(`Replication simulation started for ${collectionName}`);
      return this.replicationStates[collectionName];
    } catch (error) {
      console.error(`Failed to start replication for ${collectionName}:`, error);
      throw error;
    }
  }

  // Stop replication for a collection
  async stopReplication(collectionName) {
    if (this.replicationStates[collectionName]) {
      // Simplified - just remove from state
      delete this.replicationStates[collectionName];
      console.log(`Stopped replication for ${collectionName}`);
    }
  }

  // Start sync for all collections
  async startSync() {
    try {
      const isOnline = await this.checkNetworkStatus();
      
      if (isOnline) {
        console.log('🌐 Device is online, starting CouchDB sync...');
        const syncResults = await couchdbSync.startFullSync();
        this.lastSyncTime = new Date().toISOString();
        console.log('✅ Initial sync completed:', syncResults);
        
        // Set up periodic sync check
        this.syncInterval = setInterval(async () => {
          const stillOnline = await this.checkNetworkStatus();
          if (stillOnline) {
            try {
              await couchdbSync.startFullSync();
              this.lastSyncTime = new Date().toISOString();
              console.log('🔄 Periodic sync completed');
            } catch (syncError) {
              console.error('Periodic sync failed:', syncError);
            }
          }
        }, 60000); // Sync every 60 seconds when online
        
      } else {
        console.log('📱 Device is offline, will sync when connection available');
      }
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  }

  // Stop all sync
  async stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    await this.stopReplication('businesses');
    await this.stopReplication('articles');
    console.log('All sync stopped');
  }

  // Manual sync trigger
  async triggerSync() {
    const wasOnline = this.isOnline;
    const isOnline = await this.checkNetworkStatus();
    
    if (isOnline) {
      console.log('🔄 Manual sync triggered...');
      try {
        const syncResults = await couchdbSync.startFullSync();
        this.lastSyncTime = new Date().toISOString();
        console.log('✅ Manual sync completed:', syncResults);
        
        if (!wasOnline) {
          console.log('📶 Coming back online, starting periodic sync...');
          await this.startSync();
        }
      } catch (error) {
        console.error('❌ Manual sync failed:', error);
      }
    } else if (wasOnline) {
      console.log('📵 Going offline, stopping sync...');
      await this.stopSync();
    }
    
    return isOnline;
  }

  // Get sync status
  getSyncStatus() {
    const couchStatus = couchdbSync.getStatus();
    return {
      isOnline: this.isOnline,
      activeReplications: Object.keys(this.replicationStates),
      couchdbUrl: couchStatus.couchdbUrl,
      lastSync: this.lastSyncTime,
      retryCount: couchStatus.retryCount
    };
  }

  // Save data locally (works offline)
  async saveLocally(collectionName, data) {
    try {
      const database = getDatabase();
      const collection = database[collectionName];
      
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found`);
      }

      const doc = await collection.insert(data);
      console.log(`Data saved locally to ${collectionName}:`, doc.toJSON());
      
      // If online, sync will automatically push to CouchDB
      if (this.isOnline) {
        console.log('Device is online, data will sync to CouchDB automatically');
      } else {
        console.log('Device is offline, data saved locally and will sync when online');
      }
      
      return doc.toJSON();
    } catch (error) {
      console.error(`Failed to save data locally to ${collectionName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const replicationService = new ReplicationService();
export default replicationService;
