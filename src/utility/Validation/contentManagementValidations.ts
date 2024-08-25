import { z } from "zod";
import { numericString } from "./userValidation";
// import { editFileSchemaValidation } from "./DocumentValidation";

const String = z.string().min(3, "Enter a string longer than 3 characters");
const max_file_size: number = 10 * 1024 * 1024 * 1024;
const validAdvertisementFormat: Array<string> = [
  "png",
  "jpeg",
  "jpg",
  "heif",
  "heic",
];

const isBooleanEnum = z.enum(["true", "false"]);
export const uploadFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().refine(
    (originalname: string) => {
      const org: string = originalname.split(".").pop() as string;
      return validAdvertisementFormat.includes(org);
    },
    {
      message: "file type is not supported",
    }
  ),
  size: z.number().refine((size: number) => size <= max_file_size, {
    message: "file must be of maximum 5mb",
  }),
});
//VIDEOS
//create videos
export const CreateVideoValidation = z.object({
  vidName: String.min(1),
  vidSourceUrl: String,
  vidTags: z.string().optional(),
  isActive: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
  isSubscribed: isBooleanEnum.refine((val) =>
    isBooleanEnum.options.includes(val)
  ),
  priority: z.string().max(5),
});

export const uploadVideoValidation = z.object({
  file: uploadFileSchema,
  form_data: CreateVideoValidation,
});

//update videos
export const UpdateVideoValidation = z.object({
  file: uploadFileSchema.optional(),
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
export const CreateAdvertisementValidation = z.object({
  advName: String.min(1),
  advRedirectLink: String.min(1),
  advType: z.enum(["promotion", "feature"]),
  advPosition: z.enum(["top", "bottom"]),
  isActive: isBooleanEnum.refine((val) => isBooleanEnum.options.includes(val)),
  isSubscribed: isBooleanEnum.refine((val) =>
    isBooleanEnum.options.includes(val)
  ),
  priority: z.string(),
});

export const UploadAdvertisementValidation = z.object({
  file: uploadFileSchema.optional(),
  form_data: CreateAdvertisementValidation.optional(),
});

export const UpdateAdvertisementFormData = z.object({
  advName: String.optional(),
  advRedirectLink: String.optional(),
  advType: z.enum(["promotion", "feature"]).optional(),
  advPosition: z.enum(["top", "bottom"]).optional(),
  isActive: isBooleanEnum
    .refine((val) => isBooleanEnum.options.includes(val))
    .optional(),
  isSubscribed: isBooleanEnum
    .refine((val) => isBooleanEnum.options.includes(val))
    .optional(),
  priority: z.string().optional(),
});

export const editFileSchemaValidation = z.object({
  fieldname: z.string().optional(),
  originalname: z
    .string()
    .refine(
      (originalname: string) => {
        const org: string = originalname.split(".").pop() as string;
        return validAdvertisementFormat.includes(org);
      },
      {
        message: "file type is not supported",
      }
    )
    .optional(),
  size: z
    .number()
    .refine((size: number) => size <= max_file_size, {
      message: "file must be of maximum 5mb",
    })
    .optional(),
});

export const UpdateAdvertisementValidation = z.object({
  file: editFileSchemaValidation.optional(),
  form_data: UpdateAdvertisementFormData.optional(),
});

//FACILITIES
export const CreateFacilitiesValidation = z.object({
  facPrimaryName: String.min(1),
  facSecondaryName: String.optional(),
  facPhoneNumber: z.string().refine((value) => /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number",
  }),
  facAddress: String.min(1),
  facPincode: z.string().min(6, "Pincode should be 6 digits long"),
  facSpeciality: z.array(String).default(["General"]),
  facType: String.min(1),
  isActive: z.boolean().default(true),
});

export const UpdateFacilitiesValidation = z.object({
  facPrimaryName: String.optional(),
  facSecondaryName: String.optional(),
  facPhoneNumber: numericString.optional(),
  facAddress: String.optional(),
  facPincode: z.string().min(6, "Pincode should be 6 digits long").optional(),
  facSpeciality: z.array(String).optional(),
  facType: String.optional(),
  isActive: z.string().optional(),
});
