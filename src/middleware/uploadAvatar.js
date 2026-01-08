import multer from "multer";
import path from "path";
import fs from "fs";

/* ===== ENSURE UPLOAD DIR EXISTS ===== */
const uploadDir = "images/avatar";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ===== MULTER STORAGE ===== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || "guest";
    cb(null, `${userId}_${Date.now()}${ext}`);
  }
});

/* ===== FILE FILTER ===== */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});
