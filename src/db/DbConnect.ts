import mongoose from "mongoose";

export const DbConnect = async (url: string): Promise<void> => {
	try {
		await mongoose.connect(url);
		console.log("Connected to DB");
	} catch (err) {
		console.log(err);
	}
};
