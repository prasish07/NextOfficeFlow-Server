import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
	email: string;
	password: string;
	role: string;
	token: string;
}

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: { type: String, required: true },
	role: {
		enum: ["admin", "HR", "employee"],
		type: String,
		default: "employee",
	},
	token: { type: String },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
