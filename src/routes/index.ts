import auth from "./auth";
import employee from "./employee";

import { Router } from "express";

const router = Router();

router.use("/auth", auth);
router.use("/employee", employee);

export default router;
