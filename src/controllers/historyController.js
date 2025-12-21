// IMPORT FILE CHỮ THƯỜNG
import History from '../model/history.js'; 
import Song from '../model/song.js';
// Cần import User để populate hoạt động sâu (nested populate) nếu cần
import User from '../model/user.js'; 

export const getListeningHistory = async (req, res) => {
  try {
    // Giả sử lấy tất cả lịch sử (sau này bạn có thể lọc theo req.user._id)
    const history = await History.find()
      .populate({
        path: 'song_id',
        populate: { path: 'uploader' } // Lấy luôn thông tin người đăng bài hát
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formattedData = history.map(item => {
      const song = item.song_id;
      if (!song) return null;

      return {
        id: item._id,
        songId: song._id,
        title: song.title,
        artist: song.uploader?.username || "Unknown",
        image: song.imgUrl || "",
        plays: (song.countPlay || 0).toLocaleString(),
        likes: (song.countLike || 0).toLocaleString(),
      };
    }).filter(item => item !== null);

    res.status(200).json(formattedData);

  } catch (error) {
    console.error("❌ LỖI HISTORY:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};