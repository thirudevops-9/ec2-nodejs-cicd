"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formResponse = void 0;
const StatusCodes_1 = require("./StatusCodes");
const formResponse = (code, data) => {
    return {
        status_code: code,
        flag: StatusCodes_1.statusCodes[code].flag,
        message: StatusCodes_1.statusCodes[code].message,
        data: data,
    };
};
exports.formResponse = formResponse;
//# sourceMappingURL=FormResponse.js.map