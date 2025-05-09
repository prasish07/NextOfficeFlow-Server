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
	attachments: string[];
}

const projectSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	assigneeId: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	progress: { type: Number },
	status: { type: String, default: "To-Do" },
	estimatedTime: { type: String },
	githubRepo: { type: String },
	attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
});

const Project = mongoose.model<IProject>("Project", projectSchema);

export default Project;
