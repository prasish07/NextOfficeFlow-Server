"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const absolutePath = path_1.default.join(__dirname, "../../.env");
dotenv_1.default.config({ path: absolutePath });
const MONGO_URL = process.env.MONGO_URL || ``;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_LIFETIME = process.env.JWT_LIFETIME;
exports.config = {
    mongo: {
        url: MONGO_URL,
    },
    server: {
        port: PORT,
    },
    jwt: {
        secret: JWT_SECRET,
        lifetime: JWT_LIFETIME,
    },
};
