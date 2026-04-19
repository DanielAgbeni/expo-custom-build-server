import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI!);
  isConnected = true;
  console.log('[db] MongoDB connected');
};