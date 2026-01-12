import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { createClass } from "../controllers/class.controllers";

const router = Router();

router.post("/", verifyJWT, createClass);


export default router;