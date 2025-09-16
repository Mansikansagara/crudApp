import uuid from 'react-native-uuid';

class OfflineFirstSyncService {
    constructor() {
        this.database = null;
        this.isOnline = false;
        this.syncInProgress = false;
        this.syncQueue = [];
        this.listeners = [];
        this.lastSyncTime = null;

        // ✅ Keep credentials in the URL (no btoa/Buffer needed)
        this.couchdbUrl = 'http://admin:admin@192.168.29.13:5984';

        // Start network monitoring
        this.initNetworkMonitoring();
    }

    setDatabase(database) {
        this.database = database;
    }

    initNetworkMonitoring() {
        this.checkNetworkStatus();
        setInterval(() => this.checkNetworkStatus(), 30000);
    }

    async checkNetworkStatus() {
        try {
            const wasOnline = this.isOnline;
            const response = await fetch(`${this.couchdbUrl}`, { method: 'GET' });
            this.isOnline = response.ok;

            console.log(`Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

            if (!wasOnline && this.isOnline) {
                console.log('Device came online - starting sync...');
                this.syncWithCouchDB();
            }

            this.notifyListeners();
        } catch {
            this.isOnline = false;
            console.log('Network check failed - assuming offline');
            this.notifyListeners();
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                isOnline: this.isOnline,
                syncInProgress: this.syncInProgress,
                lastSyncTime: this.lastSyncTime
            });
        });
    }

    async createDocument(collection, data) {
        try {
            const now = new Date().toISOString();
            const document = {
                ...data,
                id: data.id || uuid.v4(),
                createdAt: now,
                updatedAt: now,
                _deleted: false
            };

            const result = await this.database[collection].insert(document);
            console.log(`Document created locally in ${collection}:`, document.id);

            await this.markForSync(collection, document.id, 'create');

            if (this.isOnline) {
                this.syncWithCouchDB();
            }

            return result;
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async updateDocument(collection, id, updates) {
        try {
            const now = new Date().toISOString();
            const result = await this.database[collection]
                .findOne(id)
                .update({ $set: { ...updates, updatedAt: now } });

            console.log(`Document updated locally in ${collection}:`, id);

            await this.markForSync(collection, id, 'update');

            if (this.isOnline) {
                this.syncWithCouchDB();
            }

            return result;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteDocument(collection, id) {
        try {
            const now = new Date().toISOString();

            await this.database[collection]
                .findOne(id)
                .update({ $set: { _deleted: true, updatedAt: now } });

            console.log(`Document soft deleted locally in ${collection}:`, id);

            await this.markForSync(collection, id, 'delete');

            if (this.isOnline) {
                this.syncWithCouchDB();
            }

            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    async markForSync(collection, documentId, operation) {
        try {
            const syncRecord = {
                id: uuid.v4(),
                collectionName: collection,
                documentId,
                operation,
                needsSync: true,
                createdAt: new Date().toISOString()
            };

            await this.database.syncmetadata.insert(syncRecord);
            console.log(`Marked for sync: ${collection}/${documentId} (${operation})`);
        } catch (error) {
            console.error('Error marking for sync:', error);
        }
    }

    async checkCouchDBConnection() {
        try {
            const response = await fetch(`${this.couchdbUrl}`, { method: 'GET' });
            return response.ok;
        } catch (error) {
            console.log('CouchDB not reachable:', error.message);
            return false;
        }
    }

    async syncWithCouchDB() {
        if (this.syncInProgress || !this.isOnline) return;

        try {
            this.syncInProgress = true;
            this.notifyListeners();

            console.log('Starting sync with CouchDB...');
            const isReachable = await this.checkCouchDBConnection();
            if (!isReachable) {
                console.log('CouchDB not reachable, skipping sync');
                return;
            }

            const pendingSyncs = await this.database.syncmetadata
                .find({ selector: { needsSync: true } })
                .exec();

            console.log(`Found ${pendingSyncs.length} documents to sync`);

            for (const syncRecord of pendingSyncs) {
                await this.syncDocument(syncRecord);
            }

            await this.pullFromCouchDB();
            this.lastSyncTime = new Date().toISOString();

            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.syncInProgress = false;
            this.notifyListeners();
        }
    }

    async syncDocument(syncRecord) {
        try {
            const { collectionName, documentId, operation } = syncRecord;
            const localDoc = await this.database[collectionName]
                .findOne(documentId)
                .exec();

            if (!localDoc && operation !== 'delete') {
                console.log(`Document ${documentId} not found locally, skipping`);
                return;
            }

            const dbCreated = await this.ensureCouchDBDatabase(collectionName);
            if (!dbCreated) {
                console.error(`Cannot sync ${collectionName}/${documentId} - database creation failed`);
                return;
            }

            let success = false;
            if (operation === 'create' || operation === 'update') {
                success = await this.pushDocumentToCouchDB(collectionName, localDoc);
            } else if (operation === 'delete') {
                success = await this.deleteDocumentInCouchDB(collectionName, documentId);
            }

            if (success) {
                await syncRecord.update({
                    $set: { needsSync: false, lastSyncedAt: new Date().toISOString() }
                });
                console.log(`Synced ${collectionName}/${documentId} (${operation})`);
            }
        } catch (error) {
            console.error(`Error syncing document ${syncRecord.documentId}:`, error);
        }
    }

    async pushDocumentToCouchDB(collection, document) {
        try {
            const couchDoc = {
                _id: document.id,
                ...document.toJSON(),
                type: collection.slice(0, -1)
            };
            delete couchDoc.id;

            const response = await fetch(`${this.couchdbUrl}/${collection}/${document.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couchDoc)
            });

            if (response.ok) {
                const result = await response.json();
                await document.update({ $set: { _rev: result.rev } });
                return true;
            } else {
                console.error('Failed to push to CouchDB:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Error pushing to CouchDB:', error);
            return false;
        }
    }

    async deleteDocumentInCouchDB(collection, documentId) {
        try {
            const getResponse = await fetch(`${this.couchdbUrl}/${collection}/${documentId}`);
            if (!getResponse.ok) {
                console.log(`Document ${documentId} not found in CouchDB`);
                return true;
            }

            const doc = await getResponse.json();
            const deleteResponse = await fetch(
                `${this.couchdbUrl}/${collection}/${documentId}?rev=${doc._rev}`,
                { method: 'DELETE' }
            );

            return deleteResponse.ok;
        } catch (error) {
            console.error('Error deleting from CouchDB:', error);
            return false;
        }
    }

    async pullFromCouchDB() {
        try {
            const collections = ['businesses', 'articles'];
            for (const collection of collections) {
                await this.pullCollectionFromCouchDB(collection);
            }
        } catch (error) {
            console.error('Error pulling from CouchDB:', error);
        }
    }

    async pullCollectionFromCouchDB(collection) {
        try {
            const response = await fetch(`${this.couchdbUrl}/${collection}/_all_docs?include_docs=true`);
            if (!response.ok) {
                console.log(`Collection ${collection} not found in CouchDB`);
                return;
            }

            const data = await response.json();
            for (const row of data.rows) {
                const couchDoc = row.doc;
                if (couchDoc._id.startsWith('_design/')) continue;

                const localDoc = {
                    id: couchDoc._id,
                    ...couchDoc,
                    _rev: couchDoc._rev
                };
                delete localDoc._id;
                delete localDoc.type;

                const existingDoc = await this.database[collection]
                    .findOne(localDoc.id)
                    .exec();

                if (existingDoc) {
                    if (!existingDoc._rev || couchDoc._rev !== existingDoc._rev) {
                        await existingDoc.update({ $set: localDoc });
                        console.log(`Updated local document: ${collection}/${localDoc.id}`);
                    }
                } else {
                    await this.database[collection].insert(localDoc);
                    console.log(`Inserted new document: ${collection}/${localDoc.id}`);
                }
            }
        } catch (error) {
            console.error(`Error pulling ${collection} from CouchDB:`, error);
        }
    }

    async ensureCouchDBDatabase(dbName) {
        try {
            console.log(`Checking if database ${dbName} exists...`);
            console.log(`${this.couchdbUrl}/${dbName}`)
            const checkResponse = await fetch(`${this.couchdbUrl}/${dbName}`);
            console.log("checkResponse", checkResponse)

            if (checkResponse.ok) {
                console.log(`✅ Database ${dbName} already exists`);
                return true;
            } else if (checkResponse.status === 404) {
                console.log(`Database ${dbName} doesn't exist, creating...`);
                const createResponse = await fetch(`${this.couchdbUrl}/${dbName}`, { method: 'PUT' });

                if (createResponse.ok) {
                    console.log(`✅ Created CouchDB database: ${dbName}`);
                    return true;
                } else {
                    const errorText = await createResponse.text();
                    console.error(`❌ Failed to create database ${dbName}:`, errorText);
                    if (errorText.includes('file_exists') || createResponse.status === 412) {
                        console.log(`✅ Database ${dbName} already exists (file_exists)`);
                        return true;
                    }
                    return false;
                }
            } else {
                console.error(`❌ Unexpected response when checking database ${dbName}:`, checkResponse.status);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error ensuring database ${dbName}:`, error);
            return false;
        }
    }

    async manualSync() {
        console.log('Manual sync triggered');
        await this.syncWithCouchDB();
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime
        };
    }
}

export const offlineFirstSync = new OfflineFirstSyncService();
export default offlineFirstSync;
