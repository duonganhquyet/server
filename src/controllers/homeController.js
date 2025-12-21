import Song from "../model/song.js"; 
import User from "../model/user.js"; 

export const getHomeData = async (req, res) => {
  try {
    // 1. Lấy bài hát từ Database
    const songs = await Song.find({ isDeleted: false })
      .populate("uploader") 
      .sort({ createdAt: -1 })
      .lean();

    // 2. Nếu không có bài nào -> Trả về rỗng chứ KHÔNG báo lỗi
    if (!songs || songs.length === 0) {
        return res.status(200).json({ topSongs: [], allSongs: [] });
    }

    // 3. Xử lý dữ liệu (đề phòng lỗi null)
    const cleanSongs = songs.map(song => ({
        ...song,
        uploader: song.uploader ? song.uploader : { username: "Unknown", _id: null }
    }));

    // 4. Chia Top/All
    const topSongs = [...cleanSongs].sort((a, b) => (b.countPlay || 0) - (a.countPlay || 0)).slice(0, 6);
    
    return res.status(200).json({
      topSongs: topSongs,
      allSongs: cleanSongs
    });

  } catch (error) {
    console.error("❌ LỖI TẠI HOME CONTROLLER:", error);
    // Quan trọng: Trả về mảng rỗng để Web không bị trắng trang
    return res.status(200).json({ topSongs: [], allSongs: [] });
  }
};