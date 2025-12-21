// src/controllers/historyController.js
import History from '../model/history.js'; 
import Song from '../model/song.js';
import User from '../model/user.js'; // Import User để populate hoạt động đúng (tùy chọn nhưng nên có)

export const getListeningHistory = async (req, res) => {
  try {
    // 1. Tìm dữ liệu lịch sử
    const history = await History.find()
      .populate({
        path: 'song_id', // Tên trường liên kết trong model History (lưu ý kiểm tra đúng tên này)
        populate: { 
          path: 'uploader', // Từ Song -> User để lấy tên ca sĩ
          select: 'username' // Chỉ lấy trường username cho nhẹ
        }
      })
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất (hoặc đổi thành listened_at nếu model bạn dùng tên đó)
      .limit(10); // Lấy 10 bài gần nhất

    // 2. Xử lý dữ liệu trả về cho Frontend
    const formattedData = history.map(item => {
      const song = item.song_id;

      // Nếu bài hát đã bị xóa khỏi database thì bỏ qua dòng lịch sử này
      if (!song) return null;

      return {
        id: item._id,          // ID của dòng lịch sử
        songId: song._id,      // ID của bài hát
        
        // Mapping dữ liệu: DB (bên phải) -> Frontend (bên trái)
        title: song.title,
        artist: song.uploader?.username || "Unknown Artist", // Lấy tên user đăng bài
        image: song.imgUrl || "https://via.placeholder.com/150", // Ảnh bìa (có fallback nếu lỗi)
        
        // Format số lượng (VD: 1000 -> "1,000")
        plays: (song.countPlay || 0).toLocaleString(),
        likes: (song.countLike || 0).toLocaleString(),
        reposts: "0" // Mặc định vì DB chưa có trường này
      };
    }).filter(item => item !== null); // Loại bỏ các giá trị null

    // 3. Trả về kết quả
    res.status(200).json(formattedData);

  } catch (error) {
    console.error("Lỗi lấy lịch sử nghe:", error);
    res.status(500).json({ message: "Lỗi Server khi lấy lịch sử nghe" });
  }
};