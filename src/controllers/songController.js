// Viet cac phuong thuc get, post, put, delete
import Song from "../model/song";
import User from "../model/user"; // Import User model for population
import Comment from "../model/comment";
import Favorite from "../model/favorite";
import fs from "fs";
import path from "path";

export const getSongs = async (req, res) => {
    try {
        const data = await Song.find().populate("uploader", "_id name roles role");
        res.status(200).json({
            statusCode: 200,
            message: "Get All Track",
            data: data
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};

export const getSongById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Song.findById(id).populate("uploader", "_id name roles role");

        if (!data) {
            return res.status(404).json({
                statusCode: 404,
                message: "Song not found",
                data: null
            });
        }
        res.status(200).json({
            statusCode: 200,
            message: "Get Song Detail Success",
            data: data
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};

export const getHomeData = async (req, res) => {
    try {
        // Lấy 50 bài mới nhất và populate uploader để hiển thị tên ca sĩ
        const songs = await Song.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("uploader", "_id name");
            
        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addSong = async (req, res) => {
    try {
        const data = await Song.create(req.body);
        res.status(201).json({
            statusCode: 201,
            message: "Add Song Success",
            data: data
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};
// like song
export const likeSong = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
        data: null
    });
    if (!id) return res.status(400).json({
        statusCode: 400,
        message: "song id is required",
        data: null
    });

    const song = await Song.findById(id);
    if (!song || song.isDeleted) return res.status(404).json({
        statusCode: 404,
        message: "Song not found",
        data: null
    });

    let favorite = await Favorite.findOne({ user: userId, track: id });
    if (favorite && !favorite.isDeleted) {
      return res.status(200).json({
        statusCode: 200,
        message: "Already liked",
        data: { liked: true }
      });
    }

    if (favorite && favorite.isDeleted) {
      favorite.isDeleted = false;
      favorite.likedAt = new Date();
      await favorite.save();
    } else {
      favorite = await Favorite.create({ user: userId, track: id });
    }

    await Song.updateOne({ _id: id }, { $inc: { countLike: 1 } });

    return res.status(200).json({
        statusCode: 200,
        message: "Liked",
        data: { liked: true }
    });
  } catch (err) {
    return res.status(500).json({
        statusCode: 500,
        message: err.message,
        data: null
    });
  }
};
// unlike song
export const unlikeSong = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
        data: null
    });
    if (!id) return res.status(400).json({
        statusCode: 400,
        message: "song id is required",
        data: null
    });

    const favorite = await Favorite.findOne({ user: userId, track: id });
    if (!favorite) {
      return res.status(404).json({
        statusCode: 404,
        message: "Favorite not found",
        data: null
      });
    }

    if (favorite.isDeleted) {
      return res.status(200).json({
        statusCode: 200,
        message: "Already unliked",
        data: { liked: false }
      });
    }

    favorite.isDeleted = true;
    await favorite.save();

    await Song.updateOne({ _id: id }, { $inc: { countLike: -1 } });

    return res.status(200).json({
        statusCode: 200,
        message: "Unliked",
        data: { liked: false }
    });
  } catch (err) {
    return res.status(500).json({
        statusCode: 500,
        message: err.message,
        data: null
    });
  }
};

// ============================================================
// 🔽 PHẦN CODE MỚI (UPLOAD, UPDATE, SEARCH)
// ============================================================

// Helper: Hàm bỏ dấu tiếng Việt
function normalizeText(str) {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

// 2. Upload Audio (Xử lý nhiều file)
export const uploadSongs = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "Không có file nào được tải lên" });

        const songs = [];
        
        // 1. Lấy ID User
        const userId = req.user && req.user._id ? req.user._id : "693d8f6d53bc79c243c10737"; 

        // --- SỬA LOGIC TẠI ĐÂY: Xác định tên Tác giả (Description) ---
        let artistName = "Unknown Artist";
        if (req.user) {
            // Ưu tiên lấy Name -> Nếu không có thì lấy Username -> Cuối cùng mới là Unknown
            artistName = req.user.name || req.user.username || "Unknown Artist";
        }
        // -------------------------------------------------------------

        for (const f of req.files) {
            const baseName = f.originalname.replace(/\.[^/.]+$/, "");
            
            // Đổi path cho đúng với static folder
            const trackPath = `/track/${f.filename}`;

            // Chuẩn hóa text (nếu có hàm normalizeText)
            const titleNorm = typeof normalizeText === 'function' ? normalizeText(baseName) : baseName.toLowerCase();
            const descNorm = typeof normalizeText === 'function' ? normalizeText(artistName) : artistName.toLowerCase();

            const newSong = await Song.create({
                title: baseName,
                title_normalized: titleNorm,
                
                // ✅ Gán tên người dùng vào description
                description: artistName, 
                description_normalized: descNorm, 

                category: "General",
                imgUrl: "", 
                trackUrl: trackPath,
                uploader: userId,
                countLike: 0,
                countPlay: 0,
                duration: 0
            });
            songs.push(newSong);
        }

        res.status(201).json({ 
            statusCode: 201,
            message: "Upload thành công", 
            data: songs 
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};
// 3. Update Cover
export const updateCover = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Thiếu file ảnh" });
        
        // --- QUAN TRỌNG: Lưu vào folder images để Frontend hiển thị được ---
        const imgPath = `/images/${req.file.filename}`;

        const song = await Song.findByIdAndUpdate(
            req.params.id,
            { imgUrl: imgPath },
            { new: true }
        );

        res.status(200).json({ 
            statusCode: 200,
            message: "Cập nhật ảnh bìa thành công", 
            data: song 
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};

// 4. Update Song Info (Chỉ update text, không xử lý file ở đây)
export const updateSongInfo = async (req, res) => {
    try {
        const { title, description } = req.body;
        const updateData = { ...req.body };

        if (title) updateData.title_normalized = normalizeText(title);
        if (description) updateData.description_normalized = normalizeText(description);

        const song = await Song.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        res.status(200).json({ 
            statusCode: 200,
            message: "Cập nhật thông tin thành công", 
            data: song 
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};

// 5. Search Songs
export const searchSongs = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) return res.status(200).json({
            statusCode: 200,
            message: "Search Success",
            data: []
        });

        const regex = new RegExp(q, "i"); 
        const regexNorm = new RegExp(normalizeText(q), "i");

        const songs = await Song.find({
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } }, 
                { category: { $regex: regex } },
                { title_normalized: { $regex: regexNorm } }
            ]
        });

        // Trả về object songs để khớp với frontend SearchPage
        res.status(200).json({
            statusCode: 200,
            message: "Search Success",
            data: songs
        }); 
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            message: error.message,
            data: null
        });
    }
};

// 6. Get Songs by Uploader
export const getSongsByUploader = async (req, res) => {
    try {
        const { id } = req.params;
        const songs = await Song.find({ uploader: id, isDeleted: false }).sort({ createdAt: -1 });
        res.json({ songs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 7. DELETE SONG (XÓA THẬT, xóa file track + cover)
export const deleteSong = async (req, res) => {
    try {
        const { id } = req.params;
        const song = await Song.findById(id);
        if (!song) return res.status(404).json({ message: "Song not found" });

        // Xử lý đường dẫn để xóa file vật lý
        // Vì trong DB lưu dạng "/filemp3/abc.mp3", ta cần bỏ dấu "/" đầu tiên đi để path.join hoạt động đúng từ root
        if (song.trackUrl) {
            const relativePath = song.trackUrl.startsWith('/') ? song.trackUrl.substring(1) : song.trackUrl;
            const trackPath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(trackPath)) fs.unlinkSync(trackPath);
        }

        if (song.imgUrl) {
            const relativePath = song.imgUrl.startsWith('/') ? song.imgUrl.substring(1) : song.imgUrl;
            const coverPath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }

        // Xóa DB
        await Song.findByIdAndDelete(id);

        res.status(200).json({ statusCode: 200, message: "Song deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
