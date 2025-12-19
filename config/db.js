import mongoose from 'mongoose';

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      dbName: 'recharge_app',
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;
