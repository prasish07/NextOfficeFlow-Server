import auth from "./auth";
import employee from "./employee";
import project from "./project";
import ticket from "./ticket";
import comment from "./comment";
import attachment from "./attachment";

import { Router } from "express";

const router = Router();

router.use(auth);
router.use(employee);
router.use(project);
router.use(ticket);
router.use(comment);
router.use(attachment);

export default router;
