import User from "../modals/user";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { attachCookiesToResponse, comparePassword } from "../utils/auth.helper";
import { hashPassword } from "../utils/auth.helper";
import { google } from "googleapis";
import { config } from "../config/config";
import { CustomerRequestInterface } from "../middleware/auth.middleware";

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

	attachCookiesToResponse(res, tokenPayload);

	res.status(StatusCodes.OK).json({ message: "Login successful" });
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
	const code = req.query.code as string;
	try {
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		const userInfo = await google
			.people({ version: "v1", auth: oauth2Client })
			.people.get({
				resourceName: "people/me",
				personFields: "names,emailAddresses",
			});

		const googleUser = userInfo?.data;

		if (
			!googleUser ||
			!googleUser.emailAddresses ||
			!googleUser.emailAddresses[0]?.metadata?.verified
		) {
			res.status(402).json({ msg: "Unauthorized" });
			return;
		}

		const email = googleUser.emailAddresses[0].value;

		const user = await User.findOne({ email });

		if (!user) {
			throw new customAPIErrors(
				"No account with this email, Please contact the support",
				StatusCodes.UNAUTHORIZED
			);
		}

		const tokenPayload = { userId: user._id, role: user.role };

		attachCookiesToResponse(res, tokenPayload);

		res.redirect("http://localhost:3000");
		// res.send("google login");
	} catch (err) {
		console.error("Error retrieving tokens:", err);
		res.status(500).send("Error retrieving tokens");
	}
};

export const getUserInfo = (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	res.status(StatusCodes.OK).json({ user });
};
