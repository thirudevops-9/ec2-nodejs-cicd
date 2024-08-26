"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editAwsFileName = void 0;
const s3Config_1 = require("../../../config/s3Config");
const editAwsFileName = async (oldKey, newKey, folder) => {
    // Copy the file to a new key
    const copySource = encodeURIComponent(`${process.env.AWS_BUCKET_DEV}/${folder}/${oldKey}`);
    await s3Config_1.s3
        .copyObject({
        Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
        CopySource: copySource,
        Key: newKey,
    })
        .promise();
    // Delete the old file
    await s3Config_1.s3
        .deleteObject({
        Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
        Key: oldKey,
    })
        .promise();
    const copiedObjectUrl = `https://${process.env.AWS_BUCKET_DEV}.s3.amazonaws.com/${folder}/${newKey}`;
    return copiedObjectUrl;
};
exports.editAwsFileName = editAwsFileName;
//# sourceMappingURL=editFileName.js.map