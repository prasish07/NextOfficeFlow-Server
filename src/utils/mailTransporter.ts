import { StatusCodes } from "http-status-codes";
import customAPIErrors from "../errors/customError";
import nodemailer from "nodemailer";
import { config } from "../config/config";

interface MailerConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}

const mailerConfig: MailerConfig = {
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: config.email as string,
		pass: config.password as string,
	},
};

const sentEmail = async (
	email: string,
	boilerPlate: string,
	subject: string
): Promise<void> => {
	try {
		const transporter = nodemailer.createTransport(mailerConfig);
		const mailOptions = {
			from: config.email as string,
			to: email,
			subject: subject,
			html: boilerPlate,
		};
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new customAPIErrors(
			"Error sending email",
			StatusCodes.INTERNAL_SERVER_ERROR
		);
	}
};
const sentEmailFrom = async (
	email: string,
	boilerPlate: string,
	subject: string,
	from: string
): Promise<void> => {
	try {
		const transporter = nodemailer.createTransport(mailerConfig);
		const mailOptions = {
			from: "prasishshrestha000999@gmail.com",
			to: email,
			subject: subject,
			html: boilerPlate,
		};
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new customAPIErrors(
			"Error sending email",
			StatusCodes.INTERNAL_SERVER_ERROR
		);
	}
};

const generatePin = (): number => {
	return Math.floor(100000 + Math.random() * 900000);
};

export { sentEmail, generatePin, sentEmailFrom };
