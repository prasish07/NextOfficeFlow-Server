"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class customeAPIErrors extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.default = customeAPIErrors;
