import { Router, Request, Response } from "express";
import { login, logout, register } from "../controllers/auth.controller";
import { googleOauthHandler } from "../controllers/auth.controller";
import { getGoogleOauthUrl } from "../middleware/getGoogleOauthUrl";

const router = Router();

router.post("/user/login", login);
router.post("/user/logout", logout);
router.post("/user/register", register);

router.get("/oauth", async (req: Request, res: Response) => {
	try {
		const googleOauthURL = await getGoogleOauthUrl();
		res.redirect(googleOauthURL);
	} catch (error) {
		console.error("Error generating Google OAuth2 URL:", error);
		res.status(500).send("Error generating Google OAuth2 URL");
	}
});

router.get("/oauth/google", googleOauthHandler);

export default router;
