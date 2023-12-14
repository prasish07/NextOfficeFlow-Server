"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.logout = exports.login = void 0;
const user_1 = __importDefault(require("../modals/user"));
const http_status_codes_1 = require("http-status-codes");
const customError_1 = __importDefault(require("../errors/customError"));
const auth_helper_1 = require("../utils/auth.helper");
const auth_helper_2 = require("../utils/auth.helper");
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new customError_1.default("Please provide email and password", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const user = await user_1.default.findOne({ email });
    if (!user) {
        throw new customError_1.default("Invalid credentials", http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    const isMatch = await (0, auth_helper_1.comparePassword)(password, user.password);
    if (!isMatch) {
        throw new customError_1.default("Invalid credentials", http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    const tokenPayload = { userId: user._id, role: user.role };
    (0, auth_helper_1.attachCookiesToResponse)(res, tokenPayload);
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: "Login successful" });
};
exports.login = login;
const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: "Logout successful" });
};
exports.logout = logout;
const register = async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        throw new customError_1.default("Please provide email and password", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const userExists = await user_1.default.findOne({ email });
    if (userExists) {
        throw new customError_1.default("User already exists with this email", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const EncryptedPassword = (0, auth_helper_2.hashPassword)(password);
    const user = await user_1.default.create({ email, password: EncryptedPassword, role });
    res.status(http_status_codes_1.StatusCodes.CREATED).json({ msg: "User created" });
};
exports.register = register;
