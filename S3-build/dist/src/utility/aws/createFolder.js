"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createS3Folder = void 0;
const HttpError_1 = __importDefault(require("../HttpError"));
const s3Config_1 = require("../../../config/s3Config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createS3Folder = async (userId) => {
    try {
        var params = {
            Bucket: process.env.AWS_BUCKET_DEV,
            Key: `${userId}/`,
        };
        const data = await s3Config_1.s3.putObject(params).promise();
        if (!data)
            return false;
        return true;
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            throw new HttpError_1.default(err.message, 500);
        }
        else {
            throw new HttpError_1.default("Internal server error", 500);
        }
    }
};
exports.createS3Folder = createS3Folder;
//# sourceMappingURL=createFolder.js.map