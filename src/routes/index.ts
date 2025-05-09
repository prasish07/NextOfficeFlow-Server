import auth from "./auth";
import employee from "./employee";
import project from "./project";
import ticket from "./ticket";
import comment from "./comment";
import attachment from "./attachment";
import attendance from "./attendance";
import request from "./request";
import CalendarEvent from "./calander";
import Appraisal from "./appraisal";
import Notification from "./notification";

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	res.send("You have entered nextofficeflow server");
});

router.use(auth);
router.use(employee);
router.use(project);
router.use(ticket);
router.use(comment);
router.use(attachment);
router.use(attendance);
router.use(request);
router.use(CalendarEvent);
router.use(Appraisal);
router.use(Notification);

export default router;
