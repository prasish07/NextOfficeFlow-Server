import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import customeAPIErrors from "../errors/customError.js";

export const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	console.log(err);
	if (err instanceof customeAPIErrors) {
		return res.status(err.statusCode).json({ message: err.message });
	}

	const user = "Sagar";

	(req as CustomerRequestInterface).user = user;

    next();

	res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
		message: err.message,
	});
};

export interface CustomerRequestInterface extends Request {
	user: string;
}
