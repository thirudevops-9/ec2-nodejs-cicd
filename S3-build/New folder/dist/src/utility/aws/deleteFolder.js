"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderFromS3 = void 0;
const s3Config_1 = require("../../../config/s3Config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const deleteFolderFromS3 = async (userId) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_DEV,
            Prefix: `${userId}/`,
        };
        const listedObjects = await s3Config_1.s3.listObjectsV2(params).promise();
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            return true;
        }
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_DEV,
            Delete: { Objects: [] },
        };
        listedObjects.Contents.forEach(({ Key }) => {
            if (Key) {
                deleteParams.Delete.Objects.push({ Key });
            }
        });
        const data = await s3Config_1.s3.deleteObjects(deleteParams).promise();
        if (listedObjects.IsTruncated) {
            await (0, exports.deleteFolderFromS3)(userId);
        }
        return !!data;
    }
    catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message);
        }
        else {
            throw new Error("Internal server error");
        }
    }
};
exports.deleteFolderFromS3 = deleteFolderFromS3;
//# sourceMappingURL=deleteFolder.js.map