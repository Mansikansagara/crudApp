import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { ArticleService } from '../services/ArticleService';
import { BusinessService } from '../services/BusinessService';
import { useFocusEffect } from '@react-navigation/native';

const ArticleListScreen = ({ navigation, route }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { businessId, businessName } = route.params || {};

  const loadArticles = async () => {
    try {
      let articleList;
      if (businessId) {
        articleList = await ArticleService.getArticlesByBusinessId(businessId);
      } else {
        articleList = await ArticleService.getArticlesWithBusinessInfo();
      }
      setArticles(articleList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load articles');
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [businessId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  const handleAddArticle = async () => {
    if (businessId) {
      navigation.navigate('ArticleForm', { businessId });
    } else {
      // Show business selection if no specific business
      try {
        const businesses = await BusinessService.getAllBusinesses();
        if (businesses.length === 0) {
          Alert.alert(
            'No Businesses',
            'Please create a business first before adding articles.',
            [
              { text: 'Cancel' },
              { text: 'Create Business', onPress: () => navigation.navigate('BusinessForm') }
            ]
          );
          return;
        }
        navigation.navigate('ArticleForm');
      } catch (error) {
        Alert.alert('Error', 'Failed to check businesses');
      }
    }
  };

  const handleEditArticle = (article) => {
    navigation.navigate('ArticleForm', { article });
  };

  const handleDeleteArticle = (article) => {
    Alert.alert(
      'Delete Article',
      `Are you sure you want to delete "${article.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ArticleService.deleteArticle(article.id);
              loadArticles();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete article');
            }
          }
        }
      ]
    );
  };

  const renderArticleItem = ({ item }) => (
    <View style={styles.articleCard}>
      <View style={styles.articleHeader}>
        <Text style={styles.articleName}>{item.name}</Text>
        <Text style={styles.articlePrice}>${item.selling_price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.articleDetails}>
        <Text style={styles.articleQty}>Quantity: {item.qty}</Text>
        {!businessId && (
          <Text style={styles.businessName}>
            Business: {item.businessName || 'Unknown'}
          </Text>
        )}
      </View>
      
      <View style={styles.articleActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditArticle(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteArticle(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.articleDate}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No articles found</Text>
      <Text style={styles.emptyStateSubtext}>
        Tap the + button to create your first article
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={articles.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddArticle}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  articlePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  articleDetails: {
    marginBottom: 12,
  },
  articleQty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ArticleListScreen;
