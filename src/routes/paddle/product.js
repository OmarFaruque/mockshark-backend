import express from "express";
import { createPaddleProduct, getPaddleProduct } from "../../controllers/paddle/paddle.js";

const router = express.Router();

router.post("/v1/paddle/products", createPaddleProduct);
router.get("/v1/paddle/products/:id", getPaddleProduct);

export default router;