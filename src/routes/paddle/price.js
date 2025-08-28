import express from "express";
import { createPaddlePrice } from "../../controllers/paddle/paddle.js";

const router = express.Router();

router.post("/v1/paddle/prices", createPaddlePrice);

export default router;