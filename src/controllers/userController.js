import User from "../model/user.js";
import jwt from "jsonwebtoken";
import Song from "../model/song.js";
import Favorite from "../model/favorite.js";
import Playlist from "../model/playlist.js";
import History from "../model/history.js";
import fs from "fs";
import path from "path";

/* ================= CHECK USERNAME (Kiểm tra tồn tại) ================= */
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }

    const user = await User.findOne({ username, isDeleted: false });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET HISTORY (Lấy lịch sử nghe của User) ================= */
// Hàm này được merge từ nhánh conflict và đổi tên cho đúng chức năng
export const getListeningHistory = async (req, res) => {
  try {
    // 1. Lấy ID user từ token
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Vui lòng đăng nhập để xem lịch sử." });
    }

    // 2. Tìm dữ liệu lịch sử
    const history = await History.find({ user: userId, isDeleted: false })
      .populate({
        path: 'track', 
        select: 'title imgUrl countPlay countLike uploader trackUrl', 
        populate: { 
          path: 'uploader', 
          select: 'username' 
        }
      })
      .sort({ listenedAt: -1 })
      .limit(20)
      .lean();

    // 3. Xử lý dữ liệu trả về
    const formattedData = history.map(item => {
      const song = item.track;

      if (!song) return null;

      return {
        historyId: item._id,
        _id: song._id,
        title: song.title,
        artist: song.uploader?.username || "Unknown Artist",
        imgUrl: song.imgUrl || "",
        trackUrl: song.trackUrl,
        countPlay: song.countPlay || 0,
        countLike: song.countLike || 0,
        listenedAt: item.listenedAt
      };
    }).filter(item => item !== null);

    res.status(200).json(formattedData);

  } catch (error) {
    console.error("Lỗi lấy lịch sử nghe:", error);
    res.status(500).json({ message: "Lỗi Server khi lấy lịch sử nghe" });
  }
};

/* ================= REGISTER ================= */

export const register = async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        message: "username, password, name are required"
      });
    }

    const existing = await User.findOne({ username, isDeleted: false });
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const user = await User.create({
      username,
      password,
      name
    });

    res.status(201).json({
      message: "Register success",
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "username and password are required"
      });
    }

    const user = await User.findOne({ username, isDeleted: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET not configured" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secret,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login success",
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CURRENT USER ================= */

export const me = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= USER STATS ================= */

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [uploadedCount, favoriteCount, playlistCount, user] =
      await Promise.all([
        Song.countDocuments({ uploader: userId, isDeleted: false }),
        Favorite.countDocuments({ user: userId, isDeleted: false }),
        Playlist.countDocuments({ user: userId, isDeleted: false }),
        User.findById(userId).select("createdAt")
      ]);

    const createdAt = user?.createdAt
      ? new Date(user.createdAt).getTime()
      : Date.now();

    const daysSinceCreated = Math.floor(
      (Date.now() - createdAt) / 86400000
    );

    res.json({
      uploadedCount,
      favoriteCount,
      playlistCount,
      daysSinceCreated,
      followedCount: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= PUBLIC USER ================= */

export const getPublicUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await User.findById(id).select(
      "_id username name imgUrl role createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE AVATAR ================= */

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;
    const targetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId.toString() !== targetId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete old avatar
    if (user.imgUrl && user.imgUrl !== "default_avatar.png") {
      try {
        const oldPath = path.join("images", user.imgUrl); // Sửa lại path cho khớp với cấu hình server
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        console.warn("Delete old avatar failed:", e.message);
      }
    }

    user.imgUrl = req.file.filename;
    await user.save();

    res.json({
      message: "Avatar updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        imgUrl: user.imgUrl
      }
    });
  } catch (err) {
    console.error("updateAvatar error:", err);
    res.status(500).json({ message: err.message });
  }
};