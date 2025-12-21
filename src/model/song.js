import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    imgUrl: { type: String },
    trackUrl: { type: String, required: true },
    countLike: { type: Number, default: 0 },
    countPlay: { type: Number, default: 0 },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    isDeleted: { type: Boolean, default: false }
}, { 
    timestamps: true,
    versionKey: false,
    collection: 'songs' // Bắt buộc
});

export default mongoose.model("Song", SongSchema);