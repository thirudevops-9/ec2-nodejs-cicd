"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.default = HTTPError;
//# sourceMappingURL=HttpError.js.map