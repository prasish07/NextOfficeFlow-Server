import { Request, Response, NextFunction } from "express";
import customAPIErrors from "../errors/customError";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/auth.helper";

export interface CustomerRequestInterface extends Request {
	user: userProps;
}

export interface userProps {
	userId: string;
	role: string;
	iat: number;
	exp: number;
}

export const validateToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.signedCookies.token;
	if (!token) {
		return next(
			new customAPIErrors(
				"Please login to access this route",
				StatusCodes.UNAUTHORIZED
			)
		);
	}
	try {
		const payload = verifyToken(token) as userProps;

		(req as CustomerRequestInterface).user = payload;

		next();
	} catch (error) {
		console.log(error);
	}
};

export const authorizePermission = (...role: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = (req as CustomerRequestInterface).user;
		if (!role.includes(user.role)) {
			return next(
				new customAPIErrors(
					"You do not have permission to access this route",
					StatusCodes.FORBIDDEN
				)
			);
		}
		next();
	};
};

export const lockUser = ()=>{
	
}
