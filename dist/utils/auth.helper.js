"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = exports.attachCookiesToResponse = exports.comparePassword = exports.verifyToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config/config");
const createToken = ({ userId, role }) => {
    const secret = config_1.config.jwt.secret;
    const token = jsonwebtoken_1.default.sign({ userId, role }, secret, {
        expiresIn: "1h",
    });
    return token;
};
exports.createToken = createToken;
const verifyToken = (token) => {
    const secret = config_1.config.jwt.secret;
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    return decoded;
};
exports.verifyToken = verifyToken;
const comparePassword = async (password, passwordBcrypt) => {
    const isMatch = await bcryptjs_1.default.compare(password, passwordBcrypt);
    return isMatch;
};
exports.comparePassword = comparePassword;
const attachCookiesToResponse = (res, tokenPayload) => {
    const token = (0, exports.createToken)(tokenPayload);
    const options = {
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: true,
    };
    res.cookie("token", token, options);
};
exports.attachCookiesToResponse = attachCookiesToResponse;
const hashPassword = (password) => {
    const salt = bcryptjs_1.default.genSaltSync(10);
    const hash = bcryptjs_1.default.hashSync(password, salt);
    return hash;
};
exports.hashPassword = hashPassword;
