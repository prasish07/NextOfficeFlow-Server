import mongoose from "mongoose";

export interface IProject extends mongoose.Document {
	title: string;
	description: string;
	startDate: Date;
	endDate: Date;
	assigneeId: string[];
	userId: string;
	progress: number;
	status: string;
	estimatedTime: string;
	githubRepo: string;
}

const projectSchema = new mongoose.Schema({
	title: { type: String, required: true },
	Description: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	AssigneeId: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	UserId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	Progress: { type: Number },
	status: { type: String, default: "To-Do" },
	estimatedTime: { type: String },
	githubRepo: { type: String },
});

const Project = mongoose.model<IProject>("Project", projectSchema);

export default Project;
