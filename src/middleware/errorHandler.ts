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

	if (err.name === "CastError") {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
	}

	// Handling Mongoose Validation Errors
	if (err.name === "ValidationError") {
		const errors: { [key: string]: string } = {};
		let firstErrorMessage: string | null = null;
		for (let field in err.errors) {
			errors[field] = err.errors[field].message;

			if (!firstErrorMessage) {
				if (err.errors[field].kind.includes("ObjectId"))
					firstErrorMessage = `Invalid ${field}`;
				else firstErrorMessage = `${err.errors[field].message}`;
			}
		}
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ message: firstErrorMessage, errors });
	}

	res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
		message: err.message,
	});
};
