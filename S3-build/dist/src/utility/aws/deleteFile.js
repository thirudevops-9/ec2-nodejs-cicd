"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = void 0;
const s3Config_1 = require("../../../config/s3Config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const deleteFile = (file, folder) => {
    const uploadParams = {
        Bucket: `${process.env.AWS_BUCKET_DEV}`,
        Key: `${folder}/${file}`,
    };
    return s3Config_1.s3.deleteObject(uploadParams).promise();
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=deleteFile.js.map