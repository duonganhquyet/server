import express from "express";
// Import hàm xử lý từ homeController (cái file chúng ta đã sửa rất kỹ)
import { getHomeData } from "../controllers/homeController.js"; 

const songRouter = express.Router();

// --- QUAN TRỌNG: ĐỊNH NGHĨA ĐÚNG ĐƯỜNG DẪN MÀ FRONTEND GỌI ---
// Frontend gọi: /api/songs/home
// App.js đã khai báo: app.use("/api", songRouter);
// Nên ở đây ta định nghĩa: /songs/home

songRouter.get("/songs/home", getHomeData); 

export default songRouter;