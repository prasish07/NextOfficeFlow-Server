import { NextFunction, Request, Response } from "express";
import { CustomerRequestInterface } from "../middleware/auth.middleware";

export const userCheck = async (req: Request, res: Response) => {
	const user = (req as CustomerRequestInterface).user;
};
