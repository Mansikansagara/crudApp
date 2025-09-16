import { createRxDatabase, addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// Add RxDB plugins
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

// Sync metadata schema for tracking changes
const syncMetadataSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    collectionName: {
      type: 'string'
    },
    documentId: {
      type: 'string'
    },
    lastSyncedAt: {
      type: 'string',
      format: 'date-time'
    },
    needsSync: {
      type: 'boolean'
    },
    operation: {
      type: 'string',
      enum: ['create', 'update', 'delete']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'collectionName', 'documentId', 'needsSync', 'operation', 'createdAt']
};

// Business schema
const businessSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'name', 'createdAt', 'updatedAt']
};

// Article schema
const articleSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string'
    },
    qty: {
      type: 'number',
      minimum: 0
    },
    selling_price: {
      type: 'number',
      minimum: 0
    },
    business_id: {
      type: 'string',
      ref: 'businesses'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'name', 'qty', 'selling_price', 'business_id', 'createdAt', 'updatedAt']
};

let database = null;

export const initDatabase = async () => {
  try {
    database = await createRxDatabase({
      name: 'myapp_db',
      storage: getRxStorageMemory(),
      multiInstance: false,
      ignoreDuplicate: true
    });

    // Add collections
    await database.addCollections({
      businesses: {
        schema: businessSchema
      },
      articles: {
        schema: articleSchema
      },
      syncmetadata: {
        schema: syncMetadataSchema
      }
    });

    console.log('Database initialized successfully');
    
    // Initialize offline-first sync service
    try {
      const { offlineFirstSync } = await import('./offlineFirstSync');
      offlineFirstSync.setDatabase(database);
      console.log('Offline-first sync service initialized');
    } catch (syncError) {
      console.log('Offline-first sync service not available:', syncError.message);
    }
    
    return database;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return database;
};

export const closeDatabase = async () => {
  if (database) {
    await database.destroy();
    database = null;
  }
};
