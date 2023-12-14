import User from "../modals/user";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
import { attachCookiesToResponse, comparePassword } from "../utils/auth.helper";
import { hashPassword } from "../utils/auth.helper";

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

	res.status(StatusCodes.OK).json({ msg: "Login successful" });
};

export const logout = async (req: Request, res: Response) => {
	res.clearCookie("token");
	res.status(StatusCodes.OK).json({ msg: "Logout successful" });
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
