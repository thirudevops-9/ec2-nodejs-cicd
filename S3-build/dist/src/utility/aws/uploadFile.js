"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.uploadMedicine = exports.uploadProfile = exports.uploadFile = void 0;
const s3Config_1 = require("../../../config/s3Config");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const deleteFile_1 = require("./deleteFile");
dotenv_1.default.config();
const uploadFile = (file, folder) => {
    const fileStream = fs_1.default.createReadStream(file.path);
    const uploadParams = {
        Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
        Body: fileStream,
        Key: file.filename,
        // ContentDisposition: "inline",
    };
    return s3Config_1.s3.upload(uploadParams).promise();
};
exports.uploadFile = uploadFile;
const uploadProfile = async (InputData) => {
    //delete existing profile image
    await (0, deleteFile_1.deleteFile)("profileImage", InputData.userId.toLowerCase());
    //add new profile
    const base64Data = Buffer.from(InputData.profileImage.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const type = InputData.profileImage.split(";")[0].split("/")[1];
    const params = {
        Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.userId}`,
        Key: `profileImage`,
        Body: base64Data,
        ContentEncoding: "base64",
        ContentType: `image/${type}`,
    };
    const { Location } = await s3Config_1.s3.upload(params).promise();
    if (Location)
        return {
            success: true,
            Location,
        };
};
exports.uploadProfile = uploadProfile;
const uploadMedicine = async (InputData) => {
    //delete existing profile image
    // await deleteFile(InputData.medImage, InputData.userId.toLowerCase());
    const currentTimeStamp = Date.now();
    //add new profile
    const base64Data = Buffer.from(InputData.medImage.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const type = InputData.medImage.split(";")[0].split("/")[1];
    const params = {
        Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.userId}`,
        Key: `medReminderImg_${currentTimeStamp}_${InputData.reminderName}`,
        Body: base64Data,
        ContentEncoding: "base64",
        ContentType: `image/${type}`,
    };
    const { Location } = await s3Config_1.s3.upload(params).promise();
    if (Location)
        return {
            success: true,
            Location,
        };
};
exports.uploadMedicine = uploadMedicine;
const uploadImage = async (InputData) => {
    //delete existing profile image
    await (0, deleteFile_1.deleteFile)(`${InputData.name}`, InputData.folder);
    //add new profile
    const base64Data = Buffer.from(InputData.image.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const type = InputData.image.split(";")[0].split("/")[1];
    const params = {
        Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.folder}`,
        Key: InputData.name,
        Body: base64Data,
        ContentEncoding: "base64",
        ContentType: `image/${type}`,
    };
    const { Location } = await s3Config_1.s3.upload(params).promise();
    if (Location)
        return {
            success: true,
            Location,
        };
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=uploadFile.js.map