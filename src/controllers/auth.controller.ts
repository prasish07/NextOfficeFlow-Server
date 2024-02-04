import User from "../modals/user";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import customAPIErrors from "../errors/customError";
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
import { generatePin, sentEmail } from "../utils/mailTransporter";
import axios from "axios";

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

	if (!user.verified) {
		const pin = generatePin();

		// pin expire date
		const expirationTime = new Date().getTime() + 130000;

		const updateUser = await User.findOneAndUpdate(
			{ email },
			{
				$set: {
					verificationPin: pin.toString(),
					verificationPinExpires: expirationTime,
				},
			},
			{ new: true, runValidators: true }
		);
		const boilerPlate = `<div style="font-family: Arial, sans-serif; background-color: #f2f2f2; padding: 20px;">
        <h2 style="color: #333;">Hello,</h2>
        <p style="color: #333;">Please use the following PIN to proceed:</p>
        <div style="display: inline-block; background-color: #3498db; color: #fff; padding: 10px 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 24px; font-weight: bold;">${pin}</h3>
        </div>
        <p style="color: #333;">If you did not request to verify your email, please ignore this email.</p>
        <p style="color: #333;">Thank you!</p>
    </div>`;

		sentEmail(email, boilerPlate, "Email verification");

		return res.status(StatusCodes.OK).json({
			message: "Please verify your email address",
			verified: false,
			userId: user._id,
			role: user.role,
		});
	}

	const tokenPayload = { userId: user._id, role: user.role };
	const token = createToken(tokenPayload);

	attachCookiesToResponse(res, tokenPayload);

	res.status(StatusCodes.OK).json({
		message: "Login successful",
		userId: user._id,
		role: user.role,
		verified: user.verified,
	});
};

export const signOut = async (req: Request, res: Response) => {
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
	const { tokens } = req.body;
	const response = await axios.get(
		`https://oauth2.googleapis.com/tokeninfo?access_token=${tokens}`
	);

	// const profileResponse = await axios.get(
	// 	"https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" +
	// 		tokens
	// );

	// // console.log(profileResponse.data.picture); // This will log the URL of the profile picture

	const googleUserInfo = response.data;

	const email = googleUserInfo.email;

	const user = await User.findOneAndUpdate(
		{ email },
		{
			$set: {
				verified: true,
			},
		}
	);

	if (!user) {
		throw new customAPIErrors(
			"No account with this email, Please contact the support",
			StatusCodes.UNAUTHORIZED
		);
	}

	const tokenPayload = { userId: user._id, role: user.role };

	attachCookiesToResponse(res, tokenPayload);

	res.json({ ...tokenPayload, message: "Login successful" });
};

export const getUserInfo = (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
	res.status(StatusCodes.OK).json({ user });
};

export const singleUserVerification = async (req: Request, res: Response) => {
	const { pin, id } = req.body;
	if (!id || !pin) {
		throw new customAPIErrors(
			"Please provide id and pin",
			StatusCodes.BAD_REQUEST
		);
	}
	const user = await User.findById(id);

	if (!user) {
		throw new customAPIErrors("User not found", StatusCodes.BAD_REQUEST);
	}
	if (user.verificationPin !== pin) {
		throw new customAPIErrors("Invalid Pin", StatusCodes.BAD_REQUEST);
	}
	const now = new Date();

	if (user.verificationPinExpires < now) {
		throw new customAPIErrors("Pin expired", StatusCodes.BAD_REQUEST);
	}
	const updateUser = await User.findOneAndUpdate(
		{ _id: id },
		{
			$set: {
				verified: true,
			},
		}
	);

	if (!updateUser) {
		throw new customAPIErrors("User not found", StatusCodes.BAD_REQUEST);
	}

	res.status(StatusCodes.OK).json({
		message: "Email verified. Please login again",
		userId: user._id,
		role: user.role,
	});
};
