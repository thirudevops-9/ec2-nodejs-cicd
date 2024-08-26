"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.region = process.env.AWS_REGION_DEV;
const accessKey = process.env.AWS_ACCESS_KEY_DEV;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY_DEV;
aws_sdk_1.default.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
});
exports.s3 = new aws_sdk_1.default.S3();
//# sourceMappingURL=s3Config.js.map