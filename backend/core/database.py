from pymongo.asynchronous.mongo_client import AsyncMongoClient
from core.config import settings

class Database:
    client: AsyncMongoClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        cls.client = AsyncMongoClient(settings.MONGODB_URI)
        # Test connection
        await cls.client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("❌ Closed MongoDB connection")
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        return cls.client[settings.DATABASE_NAME]
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection from database"""
        return cls.get_database()[collection_name]

# Singleton instance
db = Database()
