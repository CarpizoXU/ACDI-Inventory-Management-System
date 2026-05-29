const mongoose = require('mongoose');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) {
    console.log('MongoDB: reusing existing connection');
    return;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'acdi_ims';

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment');
  }

  try {
    await mongoose.connect(uri, {
      dbName,
    });
    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host} / db: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDatabase;
