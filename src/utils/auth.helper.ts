import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/config";
import { Response } from "express";
import path from "path";

export interface tokenProps {
	userId: string;
	role: string;
}

export const createToken = ({ userId, role }: tokenProps) => {
	const secret = config.jwt.secret as string;
	const token = jwt.sign({ userId, role }, secret, {
		expiresIn: "1d",
	});
	return token;
};

export const verifyToken = (token: string) => {
	const secret = config.jwt.secret as string;
	const decoded = jwt.verify(token, secret);
	return decoded;
};

export const comparePassword = async (
	password: string,
	passwordBcrypt: string
) => {
	const isMatch = await bcrypt.compare(password, passwordBcrypt);
	return isMatch;
};

export const attachCookiesToResponse = (
	res: Response,
	tokenPayload: tokenProps
) => {
	const token = createToken(tokenPayload);
	const isProduction = config.isProduction;

	const options = {
		expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
		httpOnly: true,
		secure: isProduction,
		signed: true,
		domain: isProduction ? "nextofficeflow.onrender.com" : "localhost",
		path: "/",
	};
	res.cookie("token", token, options);
};

export const hashPassword = (password: string) => {
	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);
	return hash;
};
