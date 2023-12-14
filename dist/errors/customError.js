"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class customAPIErrors extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.default = customAPIErrors;
