import mongoose from "mongoose";

export interface IAppraisal extends mongoose.Document {
	date: Date;
	userId: string;
	type: string;
	feedback: string;
	newPosition: string;
	newSalary: number;
	pastPosition: string;
	pastSalary: number;
}

const appraisalSchema = new mongoose.Schema({
	date: { type: Date, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	type: { type: String, required: true },
	feedback: { type: String, required: true },
	newPosition: { type: String },
	newSalary: { type: Number },
	pastPosition: { type: String },	
	pastSalary: { type: Number },
});

const Appraisal = mongoose.model<IAppraisal>("Appraisal", appraisalSchema);

export default Appraisal;
