import uuid from 'react-native-uuid';
import { getDatabase } from '../database/database';
import { offlineFirstSync } from '../database/offlineFirstSync';

export class BusinessService {
  static async createBusiness(businessData) {
    try {
      const business = {
        id: uuid.v4(),
        name: businessData.name
      };

      const doc = await offlineFirstSync.createDocument('businesses', business);
      console.log('Business created (offline-first):', doc.toJSON());
      return doc.toJSON();
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  }

  static async getAllBusinesses() {
    try {
      const database = getDatabase();
      const businesses = await database.businesses
        .find({
          selector: {
            _deleted: { $ne: true }
          }
        })
        .sort({ createdAt: 'desc' })
        .exec();
      
      return businesses.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error fetching businesses:', error);
      throw error;
    }
  }

  static async getBusinessById(id) {
    try {
      const database = getDatabase();
      const business = await database.businesses.findOne(id).exec();
      return business ? business.toJSON() : null;
    } catch (error) {
      console.error('Error fetching business by ID:', error);
      throw error;
    }
  }

  static async updateBusiness(id, updateData) {
    try {
      const result = await offlineFirstSync.updateDocument('businesses', id, updateData);
      console.log('Business updated (offline-first):', id);
      return result;
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  }

  static async deleteBusiness(id) {
    try {
      const database = getDatabase();
      
      // First, soft delete all articles associated with this business
      const articles = await database.articles
        .find({ 
          selector: { 
            business_id: id,
            _deleted: { $ne: true }
          } 
        })
        .exec();
      
      for (const article of articles) {
        await offlineFirstSync.deleteDocument('articles', article.id);
      }

      // Then soft delete the business
      await offlineFirstSync.deleteDocument('businesses', id);
      console.log('Business and associated articles deleted (offline-first)');
      return true;
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }

  static async getBusinessesWithArticleCount() {
    try {
      const database = getDatabase();
      const businesses = await this.getAllBusinesses();
      
      const businessesWithCount = await Promise.all(
        businesses.map(async (business) => {
          const articles = await database.articles
            .find({ 
              selector: { 
                business_id: business.id,
                _deleted: { $ne: true }
              } 
            })
            .exec();
          
          return {
            ...business,
            articleCount: articles.length
          };
        })
      );

      return businessesWithCount;
    } catch (error) {
      console.error('Error fetching businesses with article count:', error);
      throw error;
    }
  }
}
