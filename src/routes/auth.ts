import { Router, Request, Response } from "express";
import { login, logout, register } from "../controllers/auth.controller";

const router = Router();

router.post("/user/login", login);
router.post("/user/logout", logout);
router.post("/user/register", register);

export default router;
