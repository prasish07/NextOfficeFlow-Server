import mongoose from "mongoose";

export interface IReview extends mongoose.Document {
	userId: string;
	year: number;
	jobKnowledgeRating: number;
	workQualityRating: number;
	problemSolvingRating: number;
	jobKnowledgeEmployeeReview: string;
	workQualityEmployeeReview: string;
	problemSolvingEmployeeReview: string;
	jobKnowledgeManagerReview: string;
	workQualityManagerReview: string;
	problemSolvingManagerReview: string;
	ManagerId: string;
}

const reviewSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	year: { type: Number },
	jobKnowledgeRating: { type: Number },
	workQualityRating: { type: Number },
	problemSolvingRating: { type: Number },
	jobKnowledgeEmployeeReview: { type: String },
	workQualityEmployeeReview: { type: String },
	problemSolvingEmployeeReview: { type: String },
	jobKnowledgeManagerReview: { type: String },
	workQualityManagerReview: { type: String },
	problemSolvingManagerReview: { type: String },
	ManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
