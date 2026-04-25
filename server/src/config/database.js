import mongoose from 'mongoose';
import config from './config.js';

const connectDb = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Database connected');
};

export default connectDb;