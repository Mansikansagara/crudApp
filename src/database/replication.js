import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from './database';

// CouchDB configuration
const COUCHDB_URL = 'http://admin:admin@192.168.29.13:5984'; // Change this to your CouchDB server URL
const COUCHDB_USERNAME = 'admin'; // Change this to your CouchDB username
const COUCHDB_PASSWORD = 'password'; // Change this to your CouchDB password

class ReplicationManager {
  constructor() {
    this.isOnline = false;
    this.replications = {};
    this.netInfoUnsubscribe = null;
  }

  async initialize() {
    // Monitor network connectivity
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      console.log('Network status changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOnline: this.isOnline
      });

      if (!wasOnline && this.isOnline) {
        // Just came online, start replication
        this.startReplication();
      } else if (wasOnline && !this.isOnline) {
        // Just went offline, stop replication
        this.stopReplication();
      }
    });

    // Check initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;
    
    if (this.isOnline) {
      this.startReplication();
    }
  }

  async startReplication() {
    if (!this.isOnline) {
      console.log('Cannot start replication: offline');
      return;
    }

    try {
      const database = getDatabase();
      
      // Stop existing replications
      this.stopReplication();

      console.log('Starting CouchDB replication...');

      // Replicate businesses collection
      this.replications.businesses = await database.businesses.syncCouchDB({
        remote: `${COUCHDB_URL}/businesses`,
        options: {
          live: true,
          retry: true,
          auth: {
            username: COUCHDB_USERNAME,
            password: COUCHDB_PASSWORD
          }
        }
      });

      // Replicate articles collection
      this.replications.articles = await database.articles.syncCouchDB({
        remote: `${COUCHDB_URL}/articles`,
        options: {
          live: true,
          retry: true,
          auth: {
            username: COUCHDB_USERNAME,
            password: COUCHDB_PASSWORD
          }
        }
      });

      // Listen to replication events
      Object.keys(this.replications).forEach(collectionName => {
        const replication = this.replications[collectionName];
        
        replication.active$.subscribe(active => {
          console.log(`${collectionName} replication active:`, active);
        });

        replication.error$.subscribe(error => {
          console.error(`${collectionName} replication error:`, error);
        });

        replication.complete$.subscribe(complete => {
          console.log(`${collectionName} replication complete:`, complete);
        });
      });

      console.log('CouchDB replication started successfully');
    } catch (error) {
      console.error('Failed to start replication:', error);
    }
  }

  stopReplication() {
    console.log('Stopping CouchDB replication...');
    
    Object.keys(this.replications).forEach(collectionName => {
      if (this.replications[collectionName]) {
        this.replications[collectionName].cancel();
        delete this.replications[collectionName];
      }
    });
  }

  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      hasActiveReplications: Object.keys(this.replications).length > 0
    };
  }

  destroy() {
    this.stopReplication();
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }
}

export const replicationManager = new ReplicationManager();
