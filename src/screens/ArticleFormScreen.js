import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
// Removed Picker import to fix build issues
import { ArticleService } from '../services/ArticleService';
import { BusinessService } from '../services/BusinessService';

const ArticleFormScreen = ({ navigation, route }) => {
  const [articleName, setArticleName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const article = route.params?.article;
  const businessId = route.params?.businessId;
  const isEditing = !!article;

  useEffect(() => {
    loadBusinesses();
    
    if (isEditing) {
      setArticleName(article.name);
      setQuantity(article.qty.toString());
      setSellingPrice(article.selling_price.toString());
      setSelectedBusinessId(article.business_id);
    } else if (businessId) {
      setSelectedBusinessId(businessId);
    }
  }, [article, businessId, isEditing]);

  const loadBusinesses = async () => {
    try {
      const businessList = await BusinessService.getAllBusinesses();
      setBusinesses(businessList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load businesses');
      console.error('Error loading businesses:', error);
    }
  };

  const showBusinessSelector = () => {
    if (businesses.length === 0) {
      Alert.alert('No Businesses', 'Please create a business first');
      return;
    }

    Alert.alert(
      'Select Business',
      'Choose a business for this article',
      [
        ...businesses.map((business) => ({
          text: business.name,
          onPress: () => setSelectedBusinessId(business.id)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    if (!articleName.trim()) {
      Alert.alert('Error', 'Please enter an article name');
      return;
    }

    if (!quantity.trim() || isNaN(quantity) || parseInt(quantity) < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!sellingPrice.trim() || isNaN(sellingPrice) || parseFloat(sellingPrice) < 0) {
      Alert.alert('Error', 'Please enter a valid selling price');
      return;
    }

    if (!selectedBusinessId) {
      Alert.alert('Error', 'Please select a business');
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        name: articleName.trim(),
        qty: parseInt(quantity),
        selling_price: parseFloat(sellingPrice),
        business_id: selectedBusinessId
      };

      if (isEditing) {
        await ArticleService.updateArticle(article.id, articleData);
        Alert.alert('Success', 'Article updated successfully');
      } else {
        await ArticleService.createArticle(articleData);
        Alert.alert('Success', 'Article created successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} article`);
      console.error('Error saving article:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.label}>Article Name</Text>
            <TextInput
              style={styles.input}
              value={articleName}
              onChangeText={setArticleName}
              placeholder="Enter article name"
              autoFocus
              maxLength={100}
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Selling Price ($)</Text>
            <TextInput
              style={styles.input}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              placeholder="Enter selling price"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Business:</Text>
            <TouchableOpacity 
              style={styles.businessSelector}
              onPress={() => showBusinessSelector()}
            >
              <Text style={styles.businessSelectorText}>
                {selectedBusinessId ? 
                  businesses.find(b => b.id === selectedBusinessId)?.name || 'Select a business...' : 
                  'Select a business...'
                }
              </Text>
            </TouchableOpacity>

            {businesses.length === 0 && (
              <TouchableOpacity
                style={styles.createBusinessButton}
                onPress={() => navigation.navigate('BusinessForm')}
              >
                <Text style={styles.createBusinessText}>Create New Business</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : (isEditing ? 'Update Article' : 'Create Article')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  businessSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    minHeight: 50,
    justifyContent: 'center',
  },
  businessSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  createBusinessButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createBusinessText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ArticleFormScreen;
