import { google } from "googleapis";
import { config } from "../config/config";

export const getGoogleOauthUrl = async () => {
	const oauth2Client = new google.auth.OAuth2(
		config.google.clientId,
		config.google.clientSecret,
		config.google.redirect
	);
	const scopes = [
		"https://www.googleapis.com/auth/userinfo.profile",
		"https://www.googleapis.com/auth/userinfo.email",
	];
	const url = oauth2Client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: scopes,
	});
	return url;
};
