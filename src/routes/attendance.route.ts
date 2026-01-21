import { Router } from "express";
import { startAttendance } from "../controllers/attendance.controllers";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.post("/start", verifyJWT, startAttendance);

export default router;