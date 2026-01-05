import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Routers
import songRouter from "./router/songRouter.js";
import historyRouter from "./router/historyRouter.js";
import homeRouter from "./router/homeRouter.js";
import searchRouter from "./router/searchRouter.js";
import userRouter from "./router/userRouter.js";
import commentRouter from "./router/commentRouter.js";
import authRouter from "./router/authRouter.js";
import libraryRouter from "./router/libraryRouter.js";
import followRouter from "./router/followRouter.js";
import { connectDB } from "./config/db.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();


app.use(express.json());


// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// Routers (giữ nguyên)
app.use("/api", songRouter);
app.use("/api", homeRouter);
app.use("/api", historyRouter);
app.use("/api", commentRouter);

app.use("/api", authRouter);
app.use("/api/user", userRouter);
app.use("/api", libraryRouter);
app.use("/api/follow", followRouter);
// Auth router
// app.use("/api/auth", authRouter);

// file mp3
app.use('/api', searchRouter);
// app.use("/api", userRouter);


// Static files
app.use('/track', express.static(path.join(__dirname, '../filemp3')));
app.use('/images', express.static(path.join(__dirname, '../images')));


export const viteNodeApp = app;
