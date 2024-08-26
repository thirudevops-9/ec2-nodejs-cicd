"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFacilitiesValidation = exports.CreateFacilitiesValidation = exports.UpdateAdvertisementValidation = exports.editFileSchemaValidation = exports.UpdateAdvertisementFormData = exports.UploadAdvertisementValidation = exports.CreateAdvertisementValidation = exports.UpdateVideoValidation = exports.uploadVideoValidation = exports.CreateVideoValidation = exports.uploadFileSchema = void 0;
const zod_1 = require("zod");
const userValidation_1 = require("./userValidation");
// import { editFileSchemaValidation } from "./DocumentValidation";
const String = zod_1.z.string().min(3, "Enter a string longer than 3 characters");
const max_file_size = 10 * 1024 * 1024 * 1024;
const validAdvertisementFormat = [
    "png",
    "jpeg",
    "jpg",
    "heif",
    "heic",
];
const isBooleanEnum = zod_1.z.enum(["true", "false"]);
exports.uploadFileSchema = zod_1.z.object({
    fieldname: zod_1.z.string(),
    originalname: zod_1.z.string().refine((originalname) => {
        const org = originalname.split(".").pop();
        return validAdvertisementFormat.includes(org);
    }, {
        message: "file type is not supported",
    }),
    size: zod_1.z.number().refine((size) => size <= max_file_size, {
        message: "file must be of maximum 5mb",
    }),
});
//VIDEOS
//create videos
exports.CreateVideoValidation = zod_1.z.object({
    vidName: String.min(1),
    vidSourceUrl: String,
    vidTags: zod_1.z.string().optional(),
    isActive: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
    isSubscribed: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
    priority: zod_1.z.string().max(5),
});
exports.uploadVideoValidation = zod_1.z.object({
    file: exports.uploadFileSchema,
    form_data: exports.CreateVideoValidation,
});
//update videos
exports.UpdateVideoValidation = zod_1.z.object({
    file: exports.uploadFileSchema.optional(),
    vidName: String.optional(),
    vidSourceUrl: String.optional(),
    vidTags: String.optional(),
    isActive: String.optional(),
    isSubscribed: String.default("false").optional(),
    priority: String.optional(),
});
// export const UpdateVideosValidation = z.object({
//   file: uploadFileSchema,
//   data: UpdateVideoValidation,
// });
//ADVERTISEMENTS
exports.CreateAdvertisementValidation = zod_1.z.object({
    advName: String.min(1),
    advRedirectLink: String.min(1),
    advType: zod_1.z.enum(["promotion", "feature"]),
    advPosition: zod_1.z.enum(["top", "bottom"]),
    isActive: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
    isSubscribed: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
    priority: zod_1.z.string(),
});
exports.UploadAdvertisementValidation = zod_1.z.object({
    file: exports.uploadFileSchema.optional(),
    form_data: exports.CreateAdvertisementValidation.optional(),
});
exports.UpdateAdvertisementFormData = zod_1.z.object({
    advName: String.optional(),
    advRedirectLink: String.optional(),
    advType: zod_1.z.enum(["promotion", "feature"]).optional(),
    advPosition: zod_1.z.enum(["top", "bottom"]).optional(),
    isActive: isBooleanEnum
        .refine((val) => isBooleanEnum.options.includes(val))
        .optional(),
    isSubscribed: isBooleanEnum
        .refine((val) => isBooleanEnum.options.includes(val))
        .optional(),
    priority: zod_1.z.string().optional(),
});
exports.editFileSchemaValidation = zod_1.z.object({
    fieldname: zod_1.z.string().optional(),
    originalname: zod_1.z
        .string()
        .refine((originalname) => {
        const org = originalname.split(".").pop();
        return validAdvertisementFormat.includes(org);
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
exports.UpdateAdvertisementValidation = zod_1.z.object({
    file: exports.editFileSchemaValidation.optional(),
    form_data: exports.UpdateAdvertisementFormData.optional(),
});
//FACILITIES
exports.CreateFacilitiesValidation = zod_1.z.object({
    facPrimaryName: String.min(1),
    facSecondaryName: String.optional(),
    facPhoneNumber: zod_1.z.string().refine((value) => /^\d{10}$/.test(value), {
        message: "Must be a valid 10-digit phone number",
    }),
    facAddress: String.min(1),
    facPincode: zod_1.z.string().min(6, "Pincode should be 6 digits long"),
    facSpeciality: zod_1.z.array(String).default(["General"]),
    facType: String.min(1),
    isActive: zod_1.z.boolean().default(true),
});
exports.UpdateFacilitiesValidation = zod_1.z.object({
    facPrimaryName: String.optional(),
    facSecondaryName: String.optional(),
    facPhoneNumber: userValidation_1.numericString.optional(),
    facAddress: String.optional(),
    facPincode: zod_1.z.string().min(6, "Pincode should be 6 digits long").optional(),
    facSpeciality: zod_1.z.array(String).optional(),
    facType: String.optional(),
    isActive: zod_1.z.string().optional(),
});
//# sourceMappingURL=contentManagementValidations.js.map