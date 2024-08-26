"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const paths = path_1.default.join(__dirname, "../src/uploads");
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, paths);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); //datenow is used to prevent overriding of file
    },
});
exports.upload = (0, multer_1.default)({ storage });
//# sourceMappingURL=multerConfig.js.map