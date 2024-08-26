"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordValidation = exports.verifyOtpForDetailsChangeValidation = exports.verifyOtpForResetPasswordValidation = exports.generateOtpForResetPasswordValidation = exports.minorOtpLoginVerificationValidation = exports.otpLoginVerificationValidation = exports.otpLoginGenerateValidation = exports.detachloginWithPasswordValidation = exports.loginWithPasswordValidation = exports.adminSessionValidation = exports.sessionInputValidation = exports.createUserRegistration = exports.verifyOtpForRegistrationValidation = exports.ResendOtpValidation = exports.registrationValidation = void 0;
const zod_1 = require("zod");
const userValidation_1 = require("./userValidation");
const DocumentValidation_1 = require("./DocumentValidation");
const String = zod_1.z.string();
// const numericString = z.string().regex(/^\d*$/, "Must be a number");
const numericString = zod_1.z
    .string()
    .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
});
const dobString = zod_1.z
    .string()
    .date("Date must be of the format YYYY-MM-DD")
    .refine((dob) => {
    const dobDate = new Date(dob);
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 130, now.getMonth(), now.getDate());
    const eighteenYearsAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
        return false;
    }
    // Check if the date is less than 130 years old
    return ((dobDate > hundredYearsAgo && dobDate < now) ||
        (dobDate > eighteenYearsAgo && dobDate < now));
}, "Date of birth must be a valid date : older than 18 years and younger than 130 years of age.");
exports.registrationValidation = zod_1.z
    .object({
    fullName: String.min(3, "Name should be atleast 3 characters long"),
    password: zod_1.z.string().min(8),
    phoneNumber: numericString.optional(),
    emailId: userValidation_1.emailString.optional(),
    country: zod_1.z.string().min(1, "please provide country of the user"),
})
    .refine((data) => data.phoneNumber || data.emailId, {
    message: "Either phone number or email id must be provided",
    path: ["phoneNumber,emailId"],
});
exports.ResendOtpValidation = zod_1.z.object({
    id: zod_1.z.string().min(6),
});
exports.verifyOtpForRegistrationValidation = zod_1.z.object({
    id: zod_1.z.string().min(6),
    otp: zod_1.z.number(),
    consent: zod_1.z.boolean(),
});
exports.createUserRegistration = zod_1.z.object({
    id: zod_1.z.string().min(6, "ID must be at least 6 characters long"),
    emailId: String.optional(),
    phoneNumber: numericString.optional(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .optional(),
    consent: zod_1.z.boolean().optional(),
    gender: zod_1.z.enum(["male", "female", "other"]),
    dob: dobString,
    address: String.optional(),
    pincode: zod_1.z.string().min(6, "Pincode should be 6 digits long"),
    emergencyContact: numericString.optional(),
    bloodGroup: zod_1.z.string().min(1, "Blood group is required"),
    presentDiseases: zod_1.z.array(zod_1.z.string()).optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    doctorFullName: String.optional(),
    docAddress: String.optional(),
    docPhoneNumber: numericString.optional(),
    additionalInformation: String.optional(),
    language: String.optional(),
    profileImage: DocumentValidation_1.base64String.optional(),
    deviceToken: String.min(1),
});
exports.sessionInputValidation = zod_1.z.object({
    userId: String.min(1),
    password: zod_1.z
        .string()
        .optional(),
});
exports.adminSessionValidation = zod_1.z.object({
    emailId: String.min(1),
});
exports.loginWithPasswordValidation = zod_1.z.object({
    userId: String.min(1),
    password: zod_1.z.string().min(8, "Password length should be atleast 8 characters"),
    language: zod_1.z.string().min(1),
    deviceToken: String.min(1),
});
exports.detachloginWithPasswordValidation = zod_1.z.object({
    userId: String.min(1),
    password: zod_1.z.string().min(8, "Password length should be atleast 8 characters"),
});
exports.otpLoginGenerateValidation = zod_1.z.object({
    userId: String.min(1),
});
exports.otpLoginVerificationValidation = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    verifiedContact: zod_1.z.string().min(1),
    otp: zod_1.z.number().min(6, "OTP should be 6 digits long"),
    language: zod_1.z.string().min(1),
    deviceToken: String.min(1),
});
exports.minorOtpLoginVerificationValidation = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    verifiedContact: zod_1.z.string().min(1),
    otp: zod_1.z.number().min(6, "OTP should be 6 digits long"),
});
exports.generateOtpForResetPasswordValidation = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
exports.verifyOtpForResetPasswordValidation = zod_1.z.object({
    userId: zod_1.z.string().min(6, "ID must be at least 6 characters long"),
    verifiedContact: zod_1.z.string().min(1),
    otp: zod_1.z.number().min(6, "OTP should be 6 digits long"),
});
exports.verifyOtpForDetailsChangeValidation = zod_1.z.object({
    userId: zod_1.z.string().min(6, "ID must be at least 6 characters long"),
    verifiedContactId: zod_1.z.enum(["emailId", "phoneNumber"]),
    verifiedContact: zod_1.z.string().min(1),
    otp: zod_1.z.number().min(6, "OTP should be 6 digits long"),
});
exports.ResetPasswordValidation = zod_1.z.object({
    userId: zod_1.z.string().min(6, "ID must be at least 6 characters long"),
    newpassword: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
});
//# sourceMappingURL=AuthValidation.js.map