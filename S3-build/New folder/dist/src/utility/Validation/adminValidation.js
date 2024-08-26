"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminAndAuditor = exports.updateSuperAdminValidation = exports.verifyOtp = exports.createSuperAdminValidation = exports.emailStringValidation = void 0;
const zod_1 = require("zod");
const userValidation_1 = require("./userValidation");
exports.emailStringValidation = zod_1.z.object({
    emailId: userValidation_1.emailString,
});
exports.createSuperAdminValidation = zod_1.z.object({
    emailId: userValidation_1.emailString,
    // password: z.string().min(1, "Password is required"),
    fullName: zod_1.z.string().min(1, "Fullname is required"),
    position: zod_1.z.string().min(1, "position is required"),
});
exports.verifyOtp = zod_1.z.object({
    emailId: userValidation_1.emailString,
    otp: zod_1.z.number().min(4),
});
exports.updateSuperAdminValidation = zod_1.z.object({
    emailId: userValidation_1.emailString.optional(),
    fullName: zod_1.z.string().min(1, "fullname is required").optional(),
    position: zod_1.z.string().min(1, "Position is required").optional(),
});
exports.createAdminAndAuditor = zod_1.z.object({
    emailId: userValidation_1.emailString,
    fullName: zod_1.z.string().min(1, "Fullname is required"),
    position: zod_1.z.string().min(1, "position is required"),
    role: zod_1.z.enum(["ADMIN", "AUDITOR"]),
});
//# sourceMappingURL=adminValidation.js.map