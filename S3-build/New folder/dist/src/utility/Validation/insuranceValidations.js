"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeInsuranceValidation = exports.EditInsuranceValidation = exports.uploadInsuranceValidation = exports.CreateInsuranceValidation = exports.uploadFileSchemaValidation = void 0;
const zod_1 = require("zod");
const max_file_size = 10 * 1024 * 1024 * 1024; //5mb
const validFileFormat = [
    "png",
    "jpeg",
    "jpg",
    "pdf",
    "heif",
    "docx",
];
exports.uploadFileSchemaValidation = zod_1.z.object({
    fieldname: zod_1.z.string().optional(),
    originalname: zod_1.z
        .string()
        .refine((originalname) => {
        const org = originalname.split(".").pop();
        return validFileFormat.includes(org);
    }, {
        message: "file type is not supported",
    })
        .optional(),
    size: zod_1.z
        .number()
        .refine((size) => size <= max_file_size, {
        message: "file must be of maximum 5mb",
    })
        .optional(),
});
exports.CreateInsuranceValidation = zod_1.z
    .object({
    policyNum: zod_1.z.string().min(1),
    policyName: zod_1.z.string().min(1),
    policyType: zod_1.z.string().optional(),
    insuranceProv: zod_1.z.string().optional(),
    renewalAt: zod_1.z.string().date("Invalid date format. Use YYYY-MM-DD."),
    ifCoPay: zod_1.z.string().optional(),
})
    .refine((data) => {
    const { renewalAt } = data;
    if (!renewalAt)
        return true;
    const dateTime = new Date(renewalAt);
    const now = new Date();
    return dateTime > now;
}, {
    message: "Expiry of insurance date must be in the future",
    path: ["renewalAt"],
});
exports.uploadInsuranceValidation = zod_1.z.object({
    file: exports.uploadFileSchemaValidation.optional(),
    form_data: exports.CreateInsuranceValidation,
});
exports.EditInsuranceValidation = zod_1.z
    .object({
    policyNum: zod_1.z.string().optional(),
    policyName: zod_1.z.string().optional(),
    policyType: zod_1.z.string().optional(),
    insuranceProv: zod_1.z.string().optional(),
    renewalAt: zod_1.z
        .string()
        .date("Date must be of the format YYYY-MM-DD")
        .optional(),
    ifCoPay: zod_1.z.string().optional(),
})
    .refine((data) => {
    const { renewalAt } = data;
    if (!renewalAt)
        return true;
    const dateTime = new Date(renewalAt);
    const now = new Date();
    return dateTime > now;
}, {
    message: "Expiry of insurance date must be in the future",
    path: ["renewalAt"],
});
exports.ChangeInsuranceValidation = zod_1.z.object({
    file: exports.uploadFileSchemaValidation.optional(),
    form_data: exports.EditInsuranceValidation.optional(),
});
//# sourceMappingURL=insuranceValidations.js.map