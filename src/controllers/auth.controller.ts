import User from "../modals/user";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
// import { attachCookiesToResponse, comparePassword } from "../utils/auth.helper";
import {
	attachCookiesToResponse,
	comparePassword,
	createToken,
	hashPassword,
} from "../utils/auth.helper";
import { google } from "googleapis";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";
import { jwtDecode } from "jwt-decode";

type GoogleUserInfo = {
	iss: string;
	azp: string;
	aud: string;
	sub: string;
	email: string;
	email_verified: boolean;
	nbf: number;
	name: string;
	picture: string;
	given_name: string;
	family_name: string;
	locale: string;
	iat: number;
	exp: number;
	jti: string;
};

const oauth2Client = new google.auth.OAuth2(
	config.google.clientId,
	config.google.clientSecret,
	config.google.redirect
);

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		throw new customAPIErrors(
			"Please provide email and password",
			StatusCodes.BAD_REQUEST
		);
	}
	const user = await User.findOne({ email });

	if (!user) {
		throw new customAPIErrors("Invalid credentials", StatusCodes.UNAUTHORIZED);
	}

	const isMatch = await comparePassword(password, user.password);

	if (!isMatch) {
		throw new customAPIErrors("Invalid credentials", StatusCodes.UNAUTHORIZED);
	}

	const tokenPayload = { userId: user._id, role: user.role };
	const token = createToken(tokenPayload);

	attachCookiesToResponse(res, tokenPayload);

	res
		.status(StatusCodes.OK)
		.json({ message: "Login successful", userId: user._id, role: user.role });
};

export const logout = async (req: Request, res: Response) => {
	res.clearCookie("token");
	res.status(StatusCodes.OK).json({ message: "Logout successful" });
};

export const register = async (req: Request, res: Response) => {
	const { email, password, role } = req.body;

	if (!email || !password) {
		throw new customAPIErrors(
			"Please provide email and password",
			StatusCodes.BAD_REQUEST
		);
	}

	const userExists = await User.findOne({ email });

	if (userExists) {
		throw new customAPIErrors(
			"User already exists with this email",
			StatusCodes.BAD_REQUEST
		);
	}
	const EncryptedPassword = hashPassword(password);

	const user = await User.create({ email, password: EncryptedPassword, role });

	res.status(StatusCodes.CREATED).json({ msg: "User created" });
};

export const googleOauthHandler = async (req: Request, res: Response) => {
	// const code = req.query.code as string;
	try {
		// const { tokens } = await oauth2Client.getToken(code);
		// oauth2Client.setCredentials(tokens);
		const data = req.body;
		const code = data.tokens;

		const decode = jwtDecode(code) as GoogleUserInfo;

		console.log(decode.email_verified);

		// const ticket = await oauth2Client.verifyIdToken({
		// 	idToken: code,
		// 	audience: config.google.clientId,
		// });

		// console.log(ticket);

		// console.log(data);
		// oauth2Client.setCredentials(data.tokens);

		// const userInfo = await google
		// 	.people({ version: "v1", auth: oauth2Client })
		// 	.people.get({
		// 		resourceName: "people/me",
		// 		personFields: "names,emailAddresses",
		// 	});

		// const googleUser = userInfo?.data;

		// if (
		// 	// !googleUser ||
		// 	// !googleUser.emailAddresses ||
		// 	// !googleUser.emailAddresses[0]?.metadata?.verified
		// 	// decode &&
		// 	!!decode.email_verified
		// ) {
		// 	res.status(402).json({ msg: "Unauthorized" });
		// 	return;
		// }

		const email = decode.email;

		// const email = googleUser.emailAddresses[0].value;

		const user = await User.findOne({ email });

		if (!user) {
			throw new customAPIErrors(
				"No account with this email, Please contact the support",
				StatusCodes.UNAUTHORIZED
			);
		}

		const tokenPayload = { userId: user._id, role: user.role };

		attachCookiesToResponse(res, tokenPayload);

		// res.redirect("http://localhost:3000");
		res.json({ ...tokenPayload, message: "Login successful" });
	} catch (err) {
		if (err instanceof customAPIErrors) {
			throw new customAPIErrors(err.message, err.statusCode);
		}
		res.status(500).json({ message: "Google login fail" });
	}
};

export const getUserInfo = (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	res.status(StatusCodes.OK).json({ user });
};
