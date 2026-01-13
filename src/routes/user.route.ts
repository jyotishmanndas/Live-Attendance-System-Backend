import { Router } from "express";
import { userSignIn, userSignUp } from "../controllers/user.controllers";
import { verifyJWT } from "../middleware/auth.middleware";


const router = Router();

router.post("/signup", userSignUp);
router.post("/signin", userSignIn);

router.get("/auth/me", verifyJWT, )


export default router