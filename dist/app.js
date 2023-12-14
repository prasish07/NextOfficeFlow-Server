"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const DbConnect_js_1 = require("./db/DbConnect.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const notFound_js_1 = require("./middleware/notFound.js");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const config_js_1 = require("./config/config.js");
const app = (0, express_1.default)();
// port
const port = config_js_1.config.server.port;
// middlewares
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)(config_js_1.config.jwt.secret));
// routes
app.use("/api/v1", index_js_1.default);
// not found
app.use(notFound_js_1.notFound);
// error handler
app.use(errorHandler_js_1.errorHandler);
const start = async () => {
    try {
        // connecting to database
        await (0, DbConnect_js_1.DbConnect)(config_js_1.config.mongo.url);
    }
    catch (error) {
        console.log(error);
    }
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
start();
