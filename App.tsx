/**
 * Offline-First CRUD Application with RxDB, CouchDB Replication, and SQLite
 * Business and Article Management App
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';

import { initDatabase } from './src/database/database';
import { BusinessService } from './src/services/BusinessService';
import { ArticleService } from './src/services/ArticleService';
import NetworkStatus from './src/components/NetworkStatus';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');
        
        console.log('Replication service started automatically');
        
        await loadData();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initApp();
  }, []);

  const loadData = async () => {
    try {
      const businessList = await BusinessService.getAllBusinesses();
      const articleList = await ArticleService.getAllArticles();
      setBusinesses(businessList);
      setArticles(articleList);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const createSampleBusiness = async () => {
    try {
      await BusinessService.createBusiness({ name: 'Sample Business' });
      await loadData();
    } catch (err) {
      console.error('Failed to create business:', err);
    }
  };

  const createSampleArticle = async () => {
    if (businesses.length === 0) {
      await createSampleBusiness();
      const updatedBusinesses = await BusinessService.getAllBusinesses();
      setBusinesses(updatedBusinesses);
    }
    
    try {
      await ArticleService.createArticle({
        name: 'Sample Article',
        qty: 10,
        selling_price: 29.99,
        business_id: businesses[0].id
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create article:', err);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Offline-First CRUD App</Text>
        
        <NetworkStatus />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Businesses ({businesses.length})</Text>
          {businesses.map((business) => (
            <View key={business.id} style={styles.item}>
              <Text style={styles.itemText}>{business.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={createSampleBusiness}>
            <Text style={styles.buttonText}>Add Sample Business</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles ({articles.length})</Text>
          {articles.map((article) => (
            <View key={article.id} style={styles.item}>
              <Text style={styles.itemText}>
                {article.name} - Qty: {article.qty} - ${article.selling_price}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={createSampleArticle}>
            <Text style={styles.buttonText}>Add Sample Article</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#555',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    margin: 20,
  },
});

export default App;
