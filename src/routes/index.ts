import auth from "./auth";
import employee from "./employee";

import { Router } from "express";

const router = Router();

router.use(auth);
router.use(employee);

export default router;
