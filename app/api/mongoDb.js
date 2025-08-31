// app/api/mongoDb.js
import mongoose from "mongoose";

let isConnected = false; // Track connection status

export async function connectDB() {
  if (isConnected) return; // Prevent multiple connections

  try {
    // ✅ Mongoose 7+ / MongoDB driver 4+ — 
    await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    throw new Error("Failed to connect to MongoDB");
  }
}
