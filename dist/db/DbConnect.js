"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DbConnect = async (url) => {
    try {
        await mongoose_1.default.connect(url);
        console.log("Connected to DB");
    }
    catch (err) {
        console.log(err);
    }
};
exports.DbConnect = DbConnect;
