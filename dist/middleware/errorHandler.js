"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const customError_js_1 = __importDefault(require("../errors/customError.js"));
const errorHandler = (err, req, res, next) => {
    console.log(err);
    if (err instanceof customError_js_1.default) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    const user = "Sagar";
    req.user = user;
    next();
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: err.message,
    });
};
exports.errorHandler = errorHandler;
