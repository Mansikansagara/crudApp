import { getDatabase } from './database';

class CouchDBSync {
  constructor() {
    this.couchdbUrl = 'http://admin:admin@192.168.29.13:5984'; // Local CouchDB for testing
    this.isOnline = false;
    this.syncStates = {};
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  // Configure CouchDB server URL
  setCouchDBUrl(url) {
    this.couchdbUrl = url;
    console.log(`CouchDB URL set to: ${url}`);
  }

  // Check if CouchDB server is reachable
  async checkCouchDBConnection() {
    try {
      // Try basic connection first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.couchdbUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.isOnline = true;
        this.retryCount = 0;
        console.log('CouchDB server is reachable at:', this.couchdbUrl);
        return true;
      } else {
        this.isOnline = false;
        console.log('CouchDB server responded with error:', response.status);
        return false;
      }
    } catch (error) {
      this.isOnline = false;
      if (error.name === 'AbortError') {
        console.log('❌ CouchDB connection timeout');
      } else {
        console.log('❌ CouchDB server not reachable:', error.message);
      }
      console.log('💡 To enable sync: Install CouchDB and start the service');
      return false;
    }
  }

  // Create database on CouchDB server if it doesn't exist
  async createRemoteDatabase(dbName) {
    try {
      const response = await fetch(`${this.couchdbUrl}/${dbName}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok || response.status === 412) { // 412 = already exists
        console.log(`✅ Database '${dbName}' ready on CouchDB`);
        return true;
      } else {
        console.log(`❌ Failed to create database '${dbName}':`, response.status);
        return false;
      }
    } catch (error) {
      console.error(`Error creating database '${dbName}':`, error);
      return false;
    }
  }

  // Sync local data to CouchDB (push)
  async pushToCouch(collectionName) {
    try {
      const database = getDatabase();
      const collection = database[collectionName];
      
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found`);
      }

      // Get all local documents
      const localDocs = await collection.find().exec();
      console.log(`📤 Pushing ${localDocs.length} documents from ${collectionName} to CouchDB`);

      let successCount = 0;
      let errorCount = 0;

      for (const doc of localDocs) {
        try {
          const docData = doc.toJSON();
          
          // Send to CouchDB
          const response = await fetch(`${this.couchdbUrl}/${collectionName}/${docData.id}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...docData,
              _id: docData.id
            })
          });

          if (response.ok) {
            successCount++;
          } else if (response.status === 409) {
            // Document conflict - document already exists with different revision
            console.log(`⚠️ Document conflict for ${docData.id}, skipping`);
          } else {
            errorCount++;
            console.error(`Failed to push document ${docData.id}:`, response.status);
          }
        } catch (docError) {
          errorCount++;
          console.error(`Error pushing document:`, docError);
        }
      }

      console.log(`✅ Push complete for ${collectionName}: ${successCount} success, ${errorCount} errors`);
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error(`Error pushing ${collectionName} to CouchDB:`, error);
      throw error;
    }
  }

  // Sync CouchDB data to local (pull)
  async pullFromCouch(collectionName) {
    try {
      const database = getDatabase();
      const collection = database[collectionName];
      
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found`);
      }

      // Get all documents from CouchDB
      const response = await fetch(`${this.couchdbUrl}/${collectionName}/_all_docs?include_docs=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from CouchDB: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📥 Pulling ${data.rows.length} documents from CouchDB to ${collectionName}`);

      let successCount = 0;
      let errorCount = 0;

      for (const row of data.rows) {
        try {
          const remoteDoc = row.doc;
          
          // Remove CouchDB specific fields
          const { _id, _rev, ...cleanDoc } = remoteDoc;
          
          // Check if document exists locally
          const existingDoc = await collection.findOne(cleanDoc.id).exec();
          
          if (!existingDoc) {
            // Insert new document
            await collection.insert(cleanDoc);
            successCount++;
            console.log(`✅ Inserted new document: ${cleanDoc.id}`);
          } else {
            // Update existing document if different
            const existingData = existingDoc.toJSON();
            if (JSON.stringify(existingData) !== JSON.stringify(cleanDoc)) {
              await existingDoc.update({ $set: cleanDoc });
              successCount++;
              console.log(`✅ Updated document: ${cleanDoc.id}`);
            }
          }
        } catch (docError) {
          errorCount++;
          console.error(`Error pulling document:`, docError);
        }
      }

      console.log(`✅ Pull complete for ${collectionName}: ${successCount} processed, ${errorCount} errors`);
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error(`Error pulling ${collectionName} from CouchDB:`, error);
      throw error;
    }
  }

  // Full bidirectional sync
  async syncCollection(collectionName) {
    try {
      console.log(`🔄 Starting bidirectional sync for ${collectionName}`);
      
      // Create remote database if needed
      await this.createRemoteDatabase(collectionName);
      
      // Push local changes to CouchDB
      const pushResult = await this.pushToCouch(collectionName);
      
      // Pull remote changes from CouchDB
      const pullResult = await this.pullFromCouch(collectionName);
      
      console.log(`✅ Sync completed for ${collectionName}`);
      return {
        collection: collectionName,
        push: pushResult,
        pull: pullResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Sync failed for ${collectionName}:`, error);
      throw error;
    }
  }

  // Start full sync for all collections
  async startFullSync() {
    try {
      console.log('🚀 Starting full CouchDB synchronization...');
      
      // Check connection first
      const isConnected = await this.checkCouchDBConnection();
      if (!isConnected) {
        throw new Error('CouchDB server not reachable');
      }

      const results = [];
      
      // Sync businesses
      try {
        const businessResult = await this.syncCollection('businesses');
        results.push(businessResult);
      } catch (error) {
        console.error('Failed to sync businesses:', error);
      }
      
      // Sync articles
      try {
        const articleResult = await this.syncCollection('articles');
        results.push(articleResult);
      } catch (error) {
        console.error('Failed to sync articles:', error);
      }

      console.log('🎉 Full sync completed!');
      return results;
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  // Get sync status
  getStatus() {
    return {
      isOnline: this.isOnline,
      couchdbUrl: this.couchdbUrl,
      lastSync: this.lastSyncTime || null,
      retryCount: this.retryCount
    };
  }
}

// Export singleton instance
export const couchdbSync = new CouchDBSync();
export default couchdbSync;
