import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nirman";
    mongoose.set('bufferCommands', false);
    const connection = await mongoose.connect(uri, {
       serverSelectionTimeoutMS: 3000
    });
    global.IS_DEMO_MODE = false;
    console.log(`Connected to DB ✅: ${connection.connection.host}`);
  } catch (error) {
    global.IS_DEMO_MODE = true;
    console.warn("⚠️ MongoDB connection failed. Running Demo Mode!");
  }
};

export default connectDB;
