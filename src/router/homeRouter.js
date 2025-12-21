import express from "express";
import { getHomeData } from "../controllers/homeController.js";
// SỬA: Import từ historyController.js (file bạn đã tạo) thay vì userController
import { getListeningHistory } from "../controllers/historyController.js"; 

const homeRouter = express.Router();

// SỬA: Đổi 'router.get' thành 'homeRouter.get'
// Đường dẫn này sẽ ghép với /api bên app.js thành: /api/songs/home
homeRouter.get("/songs/home", getHomeData);

homeRouter.get('/history', getListeningHistory);

export default homeRouter;