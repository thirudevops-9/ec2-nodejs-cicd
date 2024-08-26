"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64ImageValidation = exports.base64String = exports.editFileValidation = exports.uploadFileValidation = exports.editFormDataValidation = exports.editFileSchemaValidation = exports.uploadFormDataValidation = exports.uploadFileSchemaValidation = void 0;
const zod_1 = require("zod");
//validations for userUploadFile
// 1. file must be in .jpeg,jpg,pdf,png,heic,docx and less than 5mb
// 2. form data must contain category: string;name: string;dr_name: string;note?: string;isSensitive: string;
const max_file_size = 10 * 1024 * 1024 * 1024;
const validFileFormat = [
    "png",
    "jpeg",
    "jpg",
    "pdf",
    "heif",
    "heic",
    "docx",
];
const CategoryEnum = zod_1.z.enum(["report", "bill", "prescription", "other"]);
const isSensitiveEnum = zod_1.z.enum(["true", "false"]);
exports.uploadFileSchemaValidation = zod_1.z.object({
    fieldname: zod_1.z.string().min(1),
    originalname: zod_1.z.string().refine((originalname) => {
        const org = originalname.split(".").pop();
        return validFileFormat.includes(org);
    }, {
        message: "file type is not supported",
    }),
    size: zod_1.z.number().refine((size) => size <= max_file_size, {
        message: "file must be of maximum 5mb",
    }),
});
exports.uploadFormDataValidation = zod_1.z
    .object({
    category: CategoryEnum.refine((val) => CategoryEnum.options.includes(val)),
    name: zod_1.z.string().min(1, "name is required"),
    dr_name: zod_1.z.string().optional(),
    documentLabName: zod_1.z.string().optional(),
    note: zod_1.z.string().optional().nullable(),
    isSensitive: isSensitiveEnum.refine((val) => isSensitiveEnum.options.includes(val)),
})
    .refine((data) => {
    const { category, documentLabName } = data;
    if ((category == "prescription" || category == "report") &&
        (documentLabName == undefined || documentLabName == ""))
        return false;
    return true;
}, {
    message: "Lab Name is compulsory when category is prescription/report",
    path: ["documentLabName"],
});
exports.editFileSchemaValidation = zod_1.z.object({
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
exports.editFormDataValidation = zod_1.z
    .object({
    category: CategoryEnum.refine((val) => CategoryEnum.options.includes(val)).optional(),
    name: zod_1.z.string().optional(),
    dr_name: zod_1.z.string().optional(),
    documentLabName: zod_1.z.string().optional(),
    note: zod_1.z.string().optional().nullable(),
    isSensitive: isSensitiveEnum
        .refine((val) => isSensitiveEnum.options.includes(val))
        .optional(),
})
    .refine((data) => {
    const { category, documentLabName } = data;
    if (category &&
        (category == "prescription" || category == "report") &&
        (documentLabName == undefined || documentLabName == ""))
        return false;
    return true;
}, {
    message: "Lab Name is compulsory when category is prescription/report",
    path: ["documentLabName"],
});
exports.uploadFileValidation = zod_1.z.object({
    file: exports.uploadFileSchemaValidation,
    form_data: exports.uploadFormDataValidation,
});
exports.editFileValidation = zod_1.z.object({
    doc_file: exports.editFileSchemaValidation.optional(),
    data: exports.editFormDataValidation.optional(),
});
const base64ImageRegex = /^data:image\/(png|jpeg|jpg|heif|heic);base64,/;
exports.base64String = zod_1.z.string().refine((data) => {
    // Allow empty string
    if (data === "") {
        return true;
    }
    // Ensure the string matches the base64 image pattern
    if (!base64ImageRegex.test(data)) {
        return false;
    }
    // Extract the base64 encoded part
    const base64String = data.replace(base64ImageRegex, "");
    // Calculate the size in bytes (1 character = 1 byte)
    const sizeInBytes = base64String.length * (3 / 4) -
        (data.indexOf("=") > 0 ? data.length - data.indexOf("=") : 0);
    // 5MB = 5 * 1024 * 1024 bytes
    return sizeInBytes <= 10 * 1024 * 1024 * 1024;
}, {
    message: "Image must be a valid base64 encoded string and not exceed 5MB in size.",
});
exports.base64ImageValidation = zod_1.z.object({
    profileImage: exports.base64String,
});
//# sourceMappingURL=DocumentValidation.js.map