import uuid from 'react-native-uuid';
import { getDatabase } from '../database/database';
import { offlineFirstSync } from '../database/offlineFirstSync';

export class ArticleService {
  static async createArticle(articleData) {
    try {
      const article = {
        id: uuid.v4(),
        name: articleData.name,
        qty: articleData.qty,
        selling_price: articleData.selling_price,
        business_id: articleData.business_id
      };

      const doc = await offlineFirstSync.createDocument('articles', article);
      console.log('Article created (offline-first):', doc.toJSON());
      return doc.toJSON();
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  static async getAllArticles() {
    try {
      const database = getDatabase();
      const articles = await database.articles
        .find({
          selector: {
            _deleted: { $ne: true }
          }
        })
        .sort({ createdAt: 'desc' })
        .exec();
      
      return articles.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }

  static async getArticlesByBusinessId(businessId) {
    try {
      const database = getDatabase();
      const articles = await database.articles
        .find({ 
          selector: { 
            business_id: businessId,
            _deleted: { $ne: true }
          } 
        })
        .sort({ createdAt: 'desc' })
        .exec();
      
      return articles.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error fetching articles by business ID:', error);
      throw error;
    }
  }

  static async getArticleById(id) {
    try {
      const database = getDatabase();
      const article = await database.articles.findOne(id).exec();
      return article ? article.toJSON() : null;
    } catch (error) {
      console.error('Error fetching article by ID:', error);
      throw error;
    }
  }

  static async updateArticle(id, updateData) {
    try {
      const result = await offlineFirstSync.updateDocument('articles', id, updateData);
      console.log('Article updated (offline-first):', id);
      return result;
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  static async deleteArticle(id) {
    try {
      await offlineFirstSync.deleteDocument('articles', id);
      console.log('Article deleted (offline-first)');
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  static async getArticlesWithBusinessInfo() {
    try {
      const database = getDatabase();
      const articles = await this.getAllArticles();
      
      const articlesWithBusiness = await Promise.all(
        articles.map(async (article) => {
          const business = await database.businesses.findOne(article.business_id).exec();
          return {
            ...article,
            businessName: business ? business.name : 'Unknown Business'
          };
        })
      );

      return articlesWithBusiness;
    } catch (error) {
      console.error('Error fetching articles with business info:', error);
      throw error;
    }
  }

  static async searchArticles(searchTerm) {
    try {
      const database = getDatabase();
      const articles = await database.articles
        .find({
          selector: {
            name: {
              $regex: new RegExp(searchTerm, 'i')
            },
            _deleted: { $ne: true }
          }
        })
        .exec();
      
      return articles.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  }
}
