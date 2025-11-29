// Test MongoDB connection
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/';
const DB_NAME = 'lokaaudit';

async function testConnection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db(DB_NAME);
    console.log(`✅ Connected to database: ${DB_NAME}`);
    
    // Test creating a collection
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.log('\n💡 Make sure MongoDB is running on localhost:27017');
    console.log('   You can start MongoDB with: mongod --dbpath <your-data-path>');
  }
}

testConnection();
