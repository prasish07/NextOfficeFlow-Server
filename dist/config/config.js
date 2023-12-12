"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Setting up path
// const absolutePath = path.resolve(__dirname, "../../.env");
// dotenv.config({ path: absolutePath });
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
