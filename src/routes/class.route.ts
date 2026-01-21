import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { addStudent, createClass, getAllStudents, getClassDetails } from "../controllers/class.controllers";

const router = Router();

router.use(verifyJWT);

router.post("/create", createClass);
router.post("/:classId/addStudent", addStudent);

router.get("/:classId/class-details", getClassDetails);
// router.get("/:classId/students-details", getStudentDetails);

router.get("/allstu", getAllStudents);


export default router;