import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    song_id: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
    action: { type: String, default: 'listen' }
}, { 
    timestamps: true,
    versionKey: false,
    collection: 'history'
});

export default mongoose.model("History", HistorySchema);