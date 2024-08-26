"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotesValidation = exports.createNotesValidation = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createNotesValidation = zod_1.default.object({
    title: zod_1.default.string().min(1, "title is required"),
    description: zod_1.default.string().min(1, "description is required"),
    color: zod_1.default.string().min(1, "color is required"),
});
exports.updateNotesValidation = zod_1.default.object({
    title: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
    color: zod_1.default.string().optional(),
});
//# sourceMappingURL=notesValidation.js.map