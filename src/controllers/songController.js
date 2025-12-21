// Viet cac phuong thuc get, post, put, delete
import Song from "../model/song.js";
import User from "../model/user.js"; // Import User model for population

export const getSongs = async (req, res) => {
    try {
        const data = await Song.find().populate("uploader", "_id name roles role");
        // Return structure matching the user's image
        res.status(201).json({
            statusCode: 201,
            message: "Get All Track",
            data: data
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
// export const getProductById = (req, res) => {
//     res.send("Hello World!");
// };

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
        res.status(500).json({message: error.message});
    }
};

export const addSong = async (req, res) => {
    try {
        const data = await Song.create(req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
