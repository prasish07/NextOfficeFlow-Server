import { Router, Request, Response } from "express";
import {
	getUserInfo,
	login,
	logout,
	register,
} from "../controllers/auth.controller";
import { googleOauthHandler } from "../controllers/auth.controller";
import { getGoogleOauthUrl } from "../middleware/getGoogleOauthUrl";
import {
	authorizePermission,
	validateToken,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/user/login", login);
router.post(
	"/user/logout",
	validateToken,
	authorizePermission("admin"),
	logout
);
router.post("/user/register", register);

router.post("/oauth", async (req: Request, res: Response) => {
	try {
		const googleOauthURL = await getGoogleOauthUrl();
		res.json({ url: googleOauthURL });
	} catch (error) {
		console.error("Error generating Google OAuth2 URL:", error);
		res.status(500).send("Error generating Google OAuth2 URL");
	}
});

router.post("/oauth/google", googleOauthHandler);

router.get("/user/info", validateToken, getUserInfo);

export default router;
