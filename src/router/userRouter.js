import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  register,
  login,
  checkUsername,
  me,
  getUserStats,
  getUserLikedSongs,
  getUserPlaylists,
  getUserHistory, // Hàm lấy lịch sử cho trang cá nhân
  getListeningHistory, // Hàm lấy lịch sử (có thể dùng chung)
  getPublicUser,
  updateAvatar,
  getAllUsers, 
  createUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Config Multer
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../images"); 
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage });

/* ========================================================
   SỬA LẠI CÁC ROUTE ĐỂ KHỚP VỚI FRONTEND (/api/user/...)
======================================================== */

// --- 1. Auth & Public ---
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/users/check", checkUsername); 
router.get("/auth/me", verifyToken, me);

// --- 2. User Features (Cá nhân) ---
// ✅ SỬA: Thêm chữ "/user" vào trước để khớp với Frontend gọi /api/user/history
router.get("/user/history", verifyToken, getUserHistory); 
router.get("/user/stats", verifyToken, getUserStats);
router.get("/user/likes", verifyToken, getUserLikedSongs);
router.get("/user/playlists", verifyToken, getUserPlaylists);

// --- 3. ADMIN MANAGEMENT ---
// Route Admin giữ nguyên /users (số nhiều)
router.get("/users", verifyToken, getAllUsers);     
router.post("/users", verifyToken, createUser);     
router.put("/users/:id", verifyToken, updateUser);  
router.delete("/users/:id", verifyToken, deleteUser);

// --- 4. Dynamic Routes ---
// Upload Avatar cũng nên quy về /user hoặc /users tùy logic
router.post("/users/:id/avatar", verifyToken, uploadAvatar.single("file"), updateAvatar);
router.get("/users/:id", getPublicUser);

export default router;