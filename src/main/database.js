const { MongoClient } = require('mongodb');

// MongoDB connection string - optional, off by default
// To enable: set MONGODB_URI environment variable or configure in .env
const MONGODB_URI = process.env.MONGODB_URI || null;
const DATABASE_NAME = process.env.DATABASE_NAME || 'fry-dvpn';
const WALLETS_COLLECTION = 'wallets';
const PLANS_COLLECTION = 'plans';
const FRY_TRANSACTIONS_COLLECTION = 'fry_transactions';

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.walletsCollection = null;
    this.plansCollection = null;
    this.fryTransactionsCollection = null;
  }

  async connect() {
    try {
      // Check if MongoDB is configured
      if (!MONGODB_URI) {
        console.log('⚠️ MongoDB not configured (MONGODB_URI not set)');
        console.log('💾 Using local in-memory fallback database');
        console.log('ℹ️  To enable MongoDB, set MONGODB_URI environment variable');
        this.isLocalFallback = true;
        return true;
      }

      console.log('🔌 Connecting to MongoDB...');
      console.log('Database name:', DATABASE_NAME);
      console.log('Wallets collection:', WALLETS_COLLECTION);
      console.log('Plans collection:', PLANS_COLLECTION);
      console.log('FRY Transactions collection:', FRY_TRANSACTIONS_COLLECTION);

      this.client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 10000, // 10 second timeout
      });

      await this.client.connect();
      console.log('✅ Connected to MongoDB successfully');

      this.db = this.client.db(DATABASE_NAME);
      this.walletsCollection = this.db.collection(WALLETS_COLLECTION);
      this.plansCollection = this.db.collection(PLANS_COLLECTION);
      this.fryTransactionsCollection = this.db.collection(FRY_TRANSACTIONS_COLLECTION);

      // Test the connection by running a simple command
      await this.db.admin().ping();
      console.log('✅ Database ping successful');
      this.isLocalFallback = false;

      // Create indexes for better performance
      await this.walletsCollection.createIndex({ walletAddress: 1 }, { unique: true });
      await this.walletsCollection.createIndex({ createdAt: 1 });
      await this.plansCollection.createIndex({ planId: 1 }, { unique: true });
      await this.plansCollection.createIndex({ isActive: 1 });
      await this.fryTransactionsCollection.createIndex({ walletAddress: 1 });
      await this.fryTransactionsCollection.createIndex({ timestamp: 1 });

      console.log('✅ Database indexes created');

      // Initialize default plans if they don't exist
      await this.initializeDefaultPlans();

      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  async initializeDefaultPlans() {
    try {
      const existingPlans = await this.plansCollection.countDocuments();
      
      if (existingPlans === 0) {
        console.log('📋 Initializing default plans...');
        
        const defaultPlans = [
          {
            planId: 'basic',
            name: 'Basic Plan',
            description: 'Basic VPN access with standard features',
            price: 5,
            duration: 30, // days
            features: ['Standard VPN access', 'Basic support', '1 device'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            planId: 'premium',
            name: 'Premium Plan',
            description: 'Premium VPN access with advanced features',
            price: 15,
            duration: 30, // days
            features: ['Premium VPN access', 'Priority support', '3 devices', 'Advanced security'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            planId: 'pro',
            name: 'Pro Plan',
            description: 'Professional VPN access with all features',
            price: 25,
            duration: 30, // days
            features: ['Pro VPN access', '24/7 support', 'Unlimited devices', 'Advanced security', 'Dedicated IP'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        await this.plansCollection.insertMany(defaultPlans);
        console.log('✅ Default plans initialized');
      } else {
        console.log('📋 Plans already exist, skipping initialization');
      }
    } catch (error) {
      console.error('❌ Error initializing default plans:', error);
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('✅ MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  // Plan management methods
  async getAllPlans() {
    try {
      if (!this.plansCollection) {
        throw new Error('Database not connected');
      }

      const plans = await this.plansCollection.find({ isActive: true }).toArray();
      return {
        success: true,
        plans: plans
      };
    } catch (error) {
      console.error('❌ Error retrieving plans:', error);
      return {
        success: false,
        message: 'Failed to retrieve plans: ' + error.message
      };
    }
  }

  async getPlan(planId) {
    try {
      if (!this.plansCollection) {
        throw new Error('Database not connected');
      }

      const plan = await this.plansCollection.findOne({ planId, isActive: true });
      return {
        success: true,
        plan: plan
      };
    } catch (error) {
      console.error('❌ Error retrieving plan:', error);
      return {
        success: false,
        message: 'Failed to retrieve plan: ' + error.message
      };
    }
  }

  async createPlan(planData) {
    try {
      if (!this.plansCollection) {
        throw new Error('Database not connected');
      }

      const planDocument = {
        planId: planData.planId,
        name: planData.name,
        description: planData.description,
        price: planData.price,
        duration: planData.duration,
        features: planData.features || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.plansCollection.insertOne(planDocument);

      console.log('✅ Plan created:', {
        planId: planData.planId,
        insertedId: result.insertedId
      });

      return {
        success: true,
        message: 'Plan created successfully',
        planId: result.insertedId
      };
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      return {
        success: false,
        message: 'Failed to create plan: ' + error.message
      };
    }
  }

  async updatePlan(planId, planData) {
    try {
      if (!this.plansCollection) {
        throw new Error('Database not connected');
      }

      const updateData = {
        ...planData,
        updatedAt: new Date()
      };

      const result = await this.plansCollection.updateOne(
        { planId },
        { $set: updateData }
      );

      console.log('✅ Plan updated:', {
        planId,
        modified: result.modifiedCount > 0
      });

      return {
        success: true,
        message: 'Plan updated successfully',
        modified: result.modifiedCount > 0
      };
    } catch (error) {
      console.error('❌ Error updating plan:', error);
      return {
        success: false,
        message: 'Failed to update plan: ' + error.message
      };
    }
  }

  async deletePlan(planId) {
    try {
      if (!this.plansCollection) {
        throw new Error('Database not connected');
      }

      // Soft delete by setting isActive to false
      const result = await this.plansCollection.updateOne(
        { planId },
        { $set: { isActive: false, updatedAt: new Date() } }
      );

      console.log('✅ Plan deleted (soft):', {
        planId,
        modified: result.modifiedCount > 0
      });

      return {
        success: true,
        message: 'Plan deleted successfully',
        modified: result.modifiedCount > 0
      };
    } catch (error) {
      console.error('❌ Error deleting plan:', error);
      return {
        success: false,
        message: 'Failed to delete plan: ' + error.message
      };
    }
  }

  // Wallet methods with plan support
  async saveWallet(walletData) {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      const walletDocument = {
        walletAddress: walletData.walletAddress,
        seedPhrase: walletData.seedPhrase,
        balance: walletData.balance || 0,
        currentPlan: walletData.currentPlan || null,
        planExpiryDate: walletData.planExpiryDate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      // Use upsert to update if exists, insert if not
      const result = await this.walletsCollection.updateOne(
        { walletAddress: walletData.walletAddress },
        { $set: walletDocument },
        { upsert: true }
      );

      console.log('✅ Wallet saved to database:', {
        walletAddress: walletData.walletAddress,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
      });

      return {
        success: true,
        message: 'Wallet saved successfully',
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
      };
    } catch (error) {
      console.error('❌ Error saving wallet to database:', error);
      return {
        success: false,
        message: 'Failed to save wallet: ' + error.message
      };
    }
  }

  async getWallet(walletAddress) {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      const wallet = await this.walletsCollection.findOne({ walletAddress });
      return {
        success: true,
        wallet: wallet
      };
    } catch (error) {
      console.error('❌ Error retrieving wallet from database:', error);
      return {
        success: false,
        message: 'Failed to retrieve wallet: ' + error.message
      };
    }
  }

  async updateWalletBalance(walletAddress, newBalance) {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      const result = await this.walletsCollection.updateOne(
        { walletAddress },
        { 
          $set: { 
            balance: newBalance,
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Wallet balance updated:', {
        walletAddress,
        newBalance,
        modified: result.modifiedCount > 0
      });

      return {
        success: true,
        message: 'Wallet balance updated successfully',
        modified: result.modifiedCount > 0
      };
    } catch (error) {
      console.error('❌ Error updating wallet balance:', error);
      return {
        success: false,
        message: 'Failed to update wallet balance: ' + error.message
      };
    }
  }

  async updateWalletPlan(walletAddress, planId) {
    try {
      console.log('🔄 updateWalletPlan called with:', { walletAddress, planId });
      
      if (!this.walletsCollection) {
        console.error('❌ Wallets collection not available');
        throw new Error('Database not connected');
      }

      console.log('✅ Wallets collection available');

      // Get the plan details
      console.log('📋 Getting plan details for planId:', planId);
      const planResult = await this.getPlan(planId);
      console.log('📋 Plan lookup result:', planResult);
      
      if (!planResult.success || !planResult.plan) {
        console.error('❌ Plan not found for ID:', planId);
        return {
          success: false,
          message: 'Plan not found'
        };
      }

      const plan = planResult.plan;
      console.log('✅ Plan found:', plan);
      
      const planExpiryDate = new Date();
      planExpiryDate.setDate(planExpiryDate.getDate() + plan.duration);
      
      console.log('📅 Calculated plan expiry date:', planExpiryDate);
      console.log('📅 Plan duration (days):', plan.duration);

      console.log('🗄️ Updating wallet in database...');
      console.log('🗄️ Query filter:', { walletAddress });
      console.log('🗄️ Update data:', { 
        currentPlan: planId,
        planExpiryDate: planExpiryDate,
        updatedAt: new Date()
      });

      const result = await this.walletsCollection.updateOne(
        { walletAddress },
        { 
          $set: { 
            currentPlan: planId,
            planExpiryDate: planExpiryDate,
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Wallet plan update result:', {
        walletAddress,
        planId,
        planExpiryDate,
        modified: result.modifiedCount > 0,
        matched: result.matchedCount > 0,
        upserted: result.upsertedCount > 0
      });

      if (result.matchedCount === 0) {
        console.warn('⚠️ No wallet found with address:', walletAddress);
      }

      if (result.modifiedCount === 0) {
        console.warn('⚠️ No documents were modified');
      }

      return {
        success: true,
        message: 'Wallet plan updated successfully',
        plan: plan,
        planExpiryDate: planExpiryDate,
        modified: result.modifiedCount > 0
      };
    } catch (error) {
      console.error('❌ Error updating wallet plan:', error);
      console.error('❌ Error stack:', error.stack);
      return {
        success: false,
        message: 'Failed to update wallet plan: ' + error.message
      };
    }
  }

  async getAllWallets() {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      const wallets = await this.walletsCollection.find({}).toArray();
      return {
        success: true,
        wallets: wallets
      };
    } catch (error) {
      console.error('❌ Error retrieving all wallets:', error);
      return {
        success: false,
        message: 'Failed to retrieve wallets: ' + error.message
      };
    }
  }

  async deleteWallet(walletAddress) {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      const result = await this.walletsCollection.deleteOne({ walletAddress });
      console.log('✅ Wallet deleted:', {
        walletAddress,
        deleted: result.deletedCount > 0
      });

      return {
        success: true,
        message: 'Wallet deleted successfully',
        deleted: result.deletedCount > 0
      };
    } catch (error) {
      console.error('❌ Error deleting wallet:', error);
      return {
        success: false,
        message: 'Failed to delete wallet: ' + error.message
      };
    }
  }

  // FRY Transaction methods
  async storeFryTransaction(transactionData) {
    try {
      if (!this.fryTransactionsCollection) {
        throw new Error('Database not connected');
      }

      // Validate transaction data
      if (!transactionData.walletAddress) {
        throw new Error('Wallet address is required');
      }

      if (!transactionData.transactionId) {
        console.warn('⚠️ No transaction ID provided, generating fallback ID');
        transactionData.transactionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Check if transaction already exists
      const existingTransaction = await this.fryTransactionsCollection.findOne({
        transactionId: transactionData.transactionId,
        walletAddress: transactionData.walletAddress
      });

      if (existingTransaction) {
        console.log('⚠️ FRY transaction already exists:', {
          walletAddress: transactionData.walletAddress,
          transactionId: transactionData.transactionId
        });
        return {
          success: true,
          message: 'FRY transaction already exists',
          transactionId: existingTransaction._id
        };
      }

      const transactionDocument = {
        walletAddress: transactionData.walletAddress,
        amount: transactionData.amount,
        transactionId: transactionData.transactionId,
        timestamp: new Date(transactionData.timestamp),
        type: transactionData.type || 'periodic_fee',
        status: transactionData.status || 'completed',
        isFallbackId: transactionData.isFallbackId || false,
        createdAt: new Date()
      };

      const result = await this.fryTransactionsCollection.insertOne(transactionDocument);

      console.log('✅ FRY transaction stored:', {
        walletAddress: transactionData.walletAddress,
        amount: transactionData.amount,
        transactionId: transactionData.transactionId,
        insertedId: result.insertedId
      });

      return {
        success: true,
        message: 'FRY transaction stored successfully',
        transactionId: result.insertedId
      };
    } catch (error) {
      console.error('❌ Error storing FRY transaction:', error);
      
      // Check if it's a duplicate key error
      if (error.code === 11000) {
        console.log('⚠️ Duplicate transaction detected, skipping storage');
        return {
          success: true,
          message: 'FRY transaction already exists (duplicate detected)'
        };
      }
      
      return {
        success: false,
        message: 'Failed to store FRY transaction: ' + error.message
      };
    }
  }

  async getFryTransactions(walletAddress) {
    try {
      if (!this.fryTransactionsCollection) {
        throw new Error('Database not connected');
      }

      const transactions = await this.fryTransactionsCollection
        .find({ walletAddress })
        .sort({ timestamp: -1 })
        .toArray();

      console.log('✅ FRY transactions retrieved:', {
        walletAddress,
        count: transactions.length
      });

      return {
        success: true,
        transactions: transactions
      };
    } catch (error) {
      console.error('❌ Error retrieving FRY transactions:', error);
      return {
        success: false,
        message: 'Failed to retrieve FRY transactions: ' + error.message
      };
    }
  }

  async getTotalFryFees(walletAddress) {
    try {
      if (!this.fryTransactionsCollection) {
        throw new Error('Database not connected');
      }

      const pipeline = [
        { $match: { walletAddress: walletAddress, status: 'completed' } },
        { $group: { _id: null, totalFees: { $sum: '$amount' } } }
      ];

      const result = await this.fryTransactionsCollection.aggregate(pipeline).toArray();
      const totalFees = result.length > 0 ? result[0].totalFees : 0;

      console.log('✅ Total FRY fees calculated:', {
        walletAddress,
        totalFees
      });

      return {
        success: true,
        totalFees: totalFees
      };
    } catch (error) {
      console.error('❌ Error calculating total FRY fees:', error);
      return {
        success: false,
        message: 'Failed to calculate total FRY fees: ' + error.message
      };
    }
  }

  async testConnection() {
    try {
      if (!this.walletsCollection) {
        throw new Error('Database not connected');
      }

      // Test by counting documents
      const walletCount = await this.walletsCollection.countDocuments();
      const planCount = await this.plansCollection.countDocuments();
      const fryTransactionCount = await this.fryTransactionsCollection.countDocuments();
      console.log('✅ Database test successful - wallets:', walletCount, 'plans:', planCount, 'fry transactions:', fryTransactionCount);
      
      return {
        success: true,
        message: 'Database connection test successful',
        walletCount: walletCount,
        planCount: planCount,
        fryTransactionCount: fryTransactionCount
      };
    } catch (error) {
      console.error('❌ Database test failed:', error);
      return {
        success: false,
        message: 'Database test failed: ' + error.message
      };
    }
  }
}

// Create and export a singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService; 