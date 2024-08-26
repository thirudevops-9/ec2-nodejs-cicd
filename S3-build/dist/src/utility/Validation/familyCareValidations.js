"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseMinorInputValidation = exports.changeAccessValidation = exports.existingUserOtpValidation = exports.existingUserValidation = exports.addNewUserFamilyCareValidation = exports.dependantRegisterValidation = void 0;
const zod_1 = require("zod");
const DocumentValidation_1 = require("./DocumentValidation");
const userValidation_1 = require("./userValidation");
const client_1 = require("@prisma/client");
const AccessTypeEnum = zod_1.z.enum([client_1.AccessType.view, client_1.AccessType.manage]);
const String = zod_1.z.string();
const numericString = zod_1.z
    .string()
    .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
});
const MinorDobString = zod_1.z
    .string()
    .date("Date must be of the format YYYY-MM-DD")
    .refine((dob) => {
    const dobDate = new Date(dob);
    const now = new Date();
    const eighteenYears = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
        return false;
    }
    // Check if the date is less than 100 years old
    return dobDate > eighteenYears && dobDate < now;
}, "Date of birth must be a valid date less than 18 years old and in the past.");
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
    // Check if the date is less than 130 years old
    return dobDate > hundredYearsAgo && dobDate < now;
}, "Date of birth must be a valid date less than 130 years old and in the past.");
exports.dependantRegisterValidation = zod_1.z.object({
    //   id: z.string().min(8, "ID must be at least 6 characters long"),
    fullName: String.min(3, "Full Name should be longer than 3 characters"),
    //   phoneNumber: numericString.optional(),
    // declaration: z.boolean(),
    gender: zod_1.z.enum(["male", "female", "other"]),
    dob: MinorDobString,
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
    relation: String.min(1, "enter valid relation"),
    profileImage: DocumentValidation_1.base64String.optional(),
    //   linkingUserId: z.string().min(6, "ID must be at least 6 characters long"),
});
exports.addNewUserFamilyCareValidation = zod_1.z.object({
    id: zod_1.z.string().min(8, "ID must be at least 8 characters long"),
    emailId: userValidation_1.emailString.optional(),
    phoneNumber: numericString.optional(),
    gender: zod_1.z.enum(["male", "female", "other"]),
    dob: dobString,
    pincode: zod_1.z.string().min(6, "Pincode should be 6 digits long"),
    bloodGroup: zod_1.z.string().min(1, "Blood group is required"),
    relation: zod_1.z.string().min(1, "Relation is required"),
    profileImage: DocumentValidation_1.base64String.optional(),
});
exports.existingUserValidation = zod_1.z.object({
    uuid: zod_1.z.string().min(1, "uuid field is required").max(8),
    relation: zod_1.z.string().min(2, "minimum 2 letters required for relation"),
});
exports.existingUserOtpValidation = zod_1.z.object({
    uuid: zod_1.z
        .string()
        .min(1, "uuid field is required and should be 8 characters long")
        .max(8),
    otp: zod_1.z.number().min(1, "otp is required"),
    relation: zod_1.z.string().min(2, "minimum 2 letters required for relation"),
});
exports.changeAccessValidation = zod_1.z.object({
    memberId: zod_1.z
        .string()
        .min(8, "uuid field is required and should be 8 characters long")
        .max(8),
    access: AccessTypeEnum,
    sensitiveAccess: zod_1.z.boolean().default(false),
});
exports.releaseMinorInputValidation = zod_1.z.object({
    minorId: zod_1.z.string().min(8, "minor UUID should be 8 digits long"),
    phoneNumber: numericString.optional(),
    emailId: userValidation_1.emailString.optional(),
});
//# sourceMappingURL=familyCareValidations.js.map