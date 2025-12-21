import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Import thư viện CORS
import { connectDB } from "./config/db.js"; // Lưu ý: Thêm đuôi .js nếu import file local

// Import các Router
import songRouter from "./router/songRouter.js"; 
import homeRouter from "./router/homeRouter.js";
import historyRouter from "./router/historyRouter.js";

// 1. Kích hoạt biến môi trường (.env)
dotenv.config();

const app = express();

// 2. Middleware
app.use(cors()); // QUAN TRỌNG: Cho phép Frontend kết nối
app.use(express.json());

// 3. Kết nối MongoDB
const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/webmusic"; 
connectDB(dbUrl);

// 4. Routes
// Gom nhóm lại cho gọn, express sẽ tự matching
app.use("/api", songRouter);
app.use('/api', homeRouter);
app.use('/api', historyRouter);

// 5. Khởi chạy Server (Standard Mode)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});