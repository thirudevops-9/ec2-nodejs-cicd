"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameFile = void 0;
const fs_1 = __importDefault(require("fs"));
const renameFile = (data, newFileName) => {
    try {
        // const type = data.mimetype.split("/")[1];
        const newPath = `${data.destination}/${newFileName}`;
        fs_1.default.renameSync(data.path, newPath);
        data.filename = `${newFileName}`;
        data.originalname = `${newFileName}`;
        data.path = newPath;
        return data;
    }
    catch (error) {
        console.error("Error renaming file:", error);
        throw error;
    }
};
exports.renameFile = renameFile;
// export const renameDocument = (data: any, newFileName: string) => {
//   try {
//     const type = data.mimetype.split("/")[1];
//     const newPath = `${data.destination}/${newFileName}.${type}`;
//     fs.renameSync(data.path, newPath);
//     data.filename = `${newFileName}.${type}`;
//     data.originalname = `${newFileName}.${type}`;
//     data.path = newPath;
//     return data;
//   } catch (error) {
//     console.error("Error renaming file:", error);
//     throw error;
//   }
// };
//# sourceMappingURL=renameFiles.js.map