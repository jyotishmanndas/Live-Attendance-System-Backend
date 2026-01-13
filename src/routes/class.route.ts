import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { addStudent, createClass } from "../controllers/class.controllers";

const router = Router();

router.post("/create", verifyJWT, createClass);
router.post("/:classId/addStudent", verifyJWT, addStudent);


export default router;