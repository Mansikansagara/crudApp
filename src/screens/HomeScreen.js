import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { replicationManager } from '../database/replication';

const HomeScreen = ({ navigation }) => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: false,
    hasActiveReplications: false
  });

  useEffect(() => {
    // Update network status periodically
    const interval = setInterval(() => {
      const status = replicationManager.getNetworkStatus();
      setNetworkStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const navigateToBusinesses = () => {
    navigation.navigate('BusinessList');
  };

  const navigateToAllArticles = () => {
    navigation.navigate('ArticleList', { businessId: null, businessName: 'All' });
  };

  const showNetworkInfo = () => {
    Alert.alert(
      'Network Status',
      `Status: ${networkStatus.isOnline ? 'Online' : 'Offline'}\n` +
      `Sync: ${networkStatus.hasActiveReplications ? 'Active' : 'Inactive'}\n\n` +
      'When online, data automatically syncs with CouchDB server.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Network Status Indicator */}
      <TouchableOpacity style={styles.statusContainer} onPress={showNetworkInfo}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: networkStatus.isOnline ? '#4CAF50' : '#F44336' }
        ]} />
        <Text style={styles.statusText}>
          {networkStatus.isOnline ? 'Online' : 'Offline'}
          {networkStatus.hasActiveReplications && ' • Syncing'}
        </Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Business Manager</Text>
        <Text style={styles.subtitle}>Offline-First CRUD Application</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={navigateToBusinesses}
          >
            <Text style={styles.buttonText}>Manage Businesses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={navigateToAllArticles}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              View All Articles
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Features:</Text>
          <Text style={styles.infoText}>• Create and manage businesses</Text>
          <Text style={styles.infoText}>• Add articles to businesses</Text>
          <Text style={styles.infoText}>• Works completely offline</Text>
          <Text style={styles.infoText}>• Auto-sync when online</Text>
          <Text style={styles.infoText}>• SQLite local storage</Text>
          <Text style={styles.infoText}>• CouchDB replication</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default HomeScreen;
