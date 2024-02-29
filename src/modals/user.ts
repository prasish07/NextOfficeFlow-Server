import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
	email: string;
	password: string;
	role: string;
	token: string;
	verificationPin: string;
	verified: boolean;
	verificationPinExpires: Date;
}

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: { type: String, required: true },
	role: {
		enum: ["admin", "HR", "employee", "project manager"],
		type: String,
		default: "employee",
	},
	token: { type: String },
	verificationPin: String,
	verified: { type: Boolean, default: false },
	verificationPinExpires: Date,
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
