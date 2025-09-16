import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NetworkStatus = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    syncInProgress: false,
    lastSync: null,
    couchdbUrl: ''
  });

  const getOnlineStatusText = (lastSync) => {
    const syncTime = lastSync ? ` (${new Date(lastSync).toLocaleTimeString()})` : '';
    return `✅ Synced with CouchDB${syncTime}`;
  };

  useEffect(() => {
    // Simplified status check
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateSyncStatus = async () => {
    try {
      // Dynamic import to avoid initialization issues
      const { offlineFirstSync } = await import('../database/offlineFirstSync');
      const status = offlineFirstSync.getSyncStatus();
      setSyncStatus({
        isOnline: status.isOnline,
        syncInProgress: status.syncInProgress,
        lastSync: status.lastSyncTime,
        couchdbUrl: 'http://admin:admin@192.168.29.13:5984'
      });
    } catch (error) {
      console.log('Offline-first sync service not available');
      setSyncStatus({
        isOnline: false,
        syncInProgress: false,
        lastSync: null,
        couchdbUrl: 'offline-mode'
      });
    }
  };

  const handleManualSync = async () => {
    try {
      const { offlineFirstSync } = await import('../database/offlineFirstSync');
      await offlineFirstSync.manualSync();
      updateSyncStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.indicator, { backgroundColor: syncStatus.isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {syncStatus.isOnline ? 'Online' : 'Offline'}
        </Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleManualSync}>
          <Text style={styles.syncButtonText}>Sync</Text>
        </TouchableOpacity>
      </View>
      
      {syncStatus.syncInProgress && (
        <Text style={styles.replicationText}>
          Syncing with CouchDB...
        </Text>
      )}
      
      <Text style={styles.infoText}>
        {syncStatus.isOnline 
          ? getOnlineStatusText(syncStatus.lastSync)
          : '📱 Offline mode - Data saved locally'
        }
      </Text>
      
      <Text style={styles.urlText}>
        Server: {syncStatus.couchdbUrl || 'Not configured'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  replicationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  urlText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});

export default NetworkStatus;
