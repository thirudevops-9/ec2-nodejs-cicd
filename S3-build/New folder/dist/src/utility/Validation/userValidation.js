"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFeedbackValidation = exports.userComplaintValidation = exports.NewContactDetailsValidations = exports.updateUserSettingValidation = exports.blockUserValidation = exports.deleteUserValidation = exports.updateUserValidation = exports.uploadProfileValidation = exports.emailString = exports.numericString = void 0;
const zod_1 = require("zod");
const DocumentValidation_1 = require("./DocumentValidation");
const String = zod_1.z.string();
exports.numericString = zod_1.z
    .string()
    .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
});
exports.emailString = zod_1.z
    .string()
    .email("Invalid email format")
    .max(280, "Email must be at most 280 characters long")
    .or(zod_1.z.literal(""));
const dobString = zod_1.z
    .string()
    .date("Date must be of the format YYYY-MM-DD")
    .refine((dob) => {
    const dobDate = new Date(dob);
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 130, now.getMonth(), now.getDate());
    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
        return false;
    }
    // Check if the date is less than 100 years old
    return dobDate > hundredYearsAgo && dobDate < now;
}, "Date of birth must be a valid date less than 130 years old and in the past.");
exports.uploadProfileValidation = zod_1.z.object({
    profileImage: zod_1.z.any(),
});
exports.updateUserValidation = zod_1.z.object({
    profileImage: DocumentValidation_1.base64String.optional(),
    emailId: exports.emailString.optional(),
    phoneNumber: exports.numericString.optional(),
    gender: zod_1.z.enum(["male", "female", "other"]).optional(),
    dob: dobString.optional(),
    address: String.optional(),
    pincode: zod_1.z.string().min(6, "Pincode should be 6 digits long").optional(),
    emergencyContact: exports.numericString.optional(),
    bloodGroup: zod_1.z.string().min(1, "Blood group is required").optional(),
    presentDiseases: zod_1.z.array(zod_1.z.string()).optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    doctorFullName: String.optional(),
    docAddress: String.optional(),
    docPhoneNumber: exports.numericString.optional(),
    additionalInformation: String.optional(),
});
exports.deleteUserValidation = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
exports.blockUserValidation = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    reason: zod_1.z.string().min(1),
});
exports.updateUserSettingValidation = zod_1.z.object({
    language: zod_1.z.string().optional(),
    appLock: zod_1.z.boolean().optional(),
    notification: zod_1.z.boolean().optional(),
});
exports.NewContactDetailsValidations = zod_1.z.object({
    id: zod_1.z.string().min(6, "ID must be at least 6 characters long"),
    emailId: exports.emailString.optional(),
    phoneNumber: exports.numericString.optional(),
});
exports.userComplaintValidation = zod_1.z.object({
    emailId: exports.emailString,
    message: String.min(1),
    type: zod_1.z.enum(["complaint", "feedback"]),
});
exports.userFeedbackValidation = zod_1.z.object({
    emailId: exports.emailString.optional(),
    message: String.min(1),
    type: zod_1.z.enum(["complaint", "feedback"]),
});
//# sourceMappingURL=userValidation.js.map