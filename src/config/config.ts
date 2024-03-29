import path from "path";
import dotenv from "dotenv";

const absolutePath = path.join(__dirname, "../../.env");
dotenv.config({ path: absolutePath });

const MONGO_URL = process.env.MONGO_URL || ``;

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_LIFETIME = process.env.JWT_LIFETIME;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const GOOGLE_REDIRECT = process.env.GOOGLE_REDIRECT;
const email = process.env.email;
const password = process.env.password;
const githubToken = process.env.GITHUB_TOKEN;

export const config = {
	mongo: {
		url: MONGO_URL,
	},
	server: {
		port: PORT,
	},
	jwt: {
		secret: JWT_SECRET,
		lifetime: JWT_LIFETIME,
	},
	google: {
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		redirect: GOOGLE_REDIRECT,
	},
	email,
	password,
	leaveDetails: {
		availableLeaves: 12,
	},
	githubToken,
};
