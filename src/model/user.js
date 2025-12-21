import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    role:     { type: String, default: "user" },
    avatar:   { type: String, default: "" }
}, { 
    timestamps: true,
    versionKey: false,
    collection: 'users' // Bắt buộc
});

export default mongoose.model("User", UserSchema);