import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campustrace';

  await mongoose.connect(mongoUri);
  console.log('Database connected');
};

export default connectDb;