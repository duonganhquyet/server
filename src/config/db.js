import mongoose from "mongoose";

export const connectDB = async (uri) => {
    try {
        // Kết nối
        const conn = await mongoose.connect(uri);
        
        console.log("-----------------------------------------------");
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Đang sử dụng Database tên: "${conn.connection.name}"`); // <--- Quan trọng
        console.log("-----------------------------------------------");

    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error);
        process.exit(1); // Thoát nếu lỗi
    }
}