import express from "express";
import { getListeningHistory } from "../controllers/historyController.js";

const historyRouter = express.Router();

historyRouter.get("/history", getListeningHistory);

export default historyRouter;